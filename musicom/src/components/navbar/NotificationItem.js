import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
  useColorMode,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { PROTECTED } from "lib/routes";
import { IconButton, Link } from "@chakra-ui/react";
import { MenuItem } from "@chakra-ui/menu";
import { formatDistanceToNow } from "date-fns";
import { FiX } from "react-icons/fi";
import { Link as goToLink } from "react-router-dom";
import {
  getIDfromUsername,
  useFollowUser,
  useUser,
  useUsername,
} from "hooks/users";
import { useEffect, useState } from "react";
import { useAuth } from "hooks/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "lib/firebase";
import { collection, addDoc } from "@firebase/firestore";
import { useNotifications } from "hooks/notifications";
import {
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
} from "@firebase/firestore";
import React, { createContext, useContext } from 'react';

export async function getFollowersCount(userId) {
  const followersRef = collection(db, "users");
  const followersQuery = query(
    followersRef,
    where("following", "array-contains", userId)
  );

  try {
    const querySnapshot = await getDocs(followersQuery);
    return querySnapshot.size; // Return the number of documents in the query result
  } catch (error) {
    console.error("Error fetching followers count:", error);
    throw error;
  }
}

export function useDeal(userId, authUserId) {
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { sendNotification } = useNotifications();
  const { user: authUser } = useAuth();

  useEffect(() => {
    async function checkIsRequested() {
      if (authUserId) {
        const userDoc = await getDoc(doc(collection(db, "users"), authUserId));
        const dealList = userDoc.data().dealing || [];

        setIsRequested(dealList.includes(userId));
      }
    }

    checkIsRequested();
    return;
  }, [userId, authUserId]);

  const requestUser = async () => {
    try {
      setIsLoading(true);

      const userDocRef = doc(collection(db, "users"), authUserId);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.data();
        const dealingList = userDocData.dealing || [];

        await updateDoc(userDocRef, {
          dealing: [...dealingList, userId],
        });

        const dealUserDocRef = doc(collection(db, "users"), userId);
        const dealUserDocSnapshot = await getDoc(dealUserDocRef);

        if (dealUserDocSnapshot.exists()) {
          const dealUserDocData = dealUserDocSnapshot.data();
          const dealsList = dealUserDocData.deals || [];

          await updateDoc(dealUserDocRef, {
            deals: [...dealsList, authUserId],
          });

          await sendNotification({
            title: "New deal",
            content: `@${authUser.username} sent you a  request.`,
            uid: userId,
            from: authUserId,
            type: "deal",
            time: Date.now(),
          });

          setIsRequested(true);
          setIsLoading(false);

          toast({
            title: "Deal Request Sent",
            status: "success",
            isClosable: true,
            position: "top",
            duration: 5000,
          });
        } else {
          console.error("Deal user document does not exist");
          setIsLoading(false);

          toast({
            title: "Failed to send deal",
            description:
              "An error occurred while requesting the user. Please try again.",
            status: "error",
            isClosable: true,
            position: "top",
            duration: 5000,
          });
        }
      } else {
        console.error("User document does not exist");
        setIsLoading(false);

        toast({
          title: "Failed to send deal",
          description:
            "An error occurred while requesting the user. Please try again.",
          status: "error",
          isClosable: true,
          position: "top",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error requesting user:", error);
      setIsLoading(false);

      toast({
        title: "Failed to request user",
        description:
          "An error occurred while requesting the user. Please try again.",
        status: "error",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    }
  };

  const cancelDealUser = async () => {
    try {
      setIsLoading(true);

      const userDocRef = doc(collection(db, "users"), authUserId);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.data();
        const dealingList = userDocData.dealing || [];

        await updateDoc(userDocRef, {
          dealing: dealingList.filter((id) => id !== userId),
        });
      }

      const dealUserDocRef = doc(collection(db, "users"), userId);
      const dealUserDocSnapshot = await getDoc(dealUserDocRef);

      if (dealUserDocSnapshot.exists()) {
        const dealUserDocData = dealUserDocSnapshot.data();
        const dealsList = dealUserDocData.deals || [];

        await updateDoc(dealUserDocRef, {
          deals: dealsList.filter((id) => id !== authUserId),
        });
      }

      // Check if notification exists
      const notificationSnapshot = await getDocs(
        query(
          collection(db, "notifications"),
          where("uid", "==", userId),
          where("type", "==", "deal"),
          where("from", "==", authUserId)
        )
      );

      if (!notificationSnapshot.empty) {
        notificationSnapshot.docs.forEach((docSnapshot) => {
          deleteDoc(doc(db, "notifications", docSnapshot.id));
        });
      }

      setIsRequested(false);
      setIsLoading(false);
      await sendNotification({
        title: "Deal canceled!",
        content: `@${authUser.username} canceled the deal.`,
        uid: userId,
        from: authUserId,
        type: "cancelDeal",
        time: Date.now(),
      });
      toast({
        title: "Deal canceled!",
        status: "success",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error canceling deal:", error);
      setIsLoading(false);

      toast({
        title: "Failed to cancel deal",
        description:
          "An error occurred while canceling the deal. Please try again.",
        status: "error",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    }
  };

  return { isRequested, isLoading, requestUser, cancelDealUser };
}

export function DealButton({ userId, authUserId, isMobile }) {
  const { isRequested, isLoading, requestUser, cancelDealUser } = useDeal(
    userId,
    authUserId
  );
  const { isRequested: isAccepted } = useDeal(authUserId, userId);

  const handleRequestUser = async () => {
    await requestUser();
  };

  const handleCancelDealUser = async () => {
    await cancelDealUser();
  };

  return (
    <>
      {isMobile ? (
        <Button
          pos="flex"
          mb=""
          ml="auto"
          colorScheme={isRequested ? "gray" : "blue"}
          onClick={isRequested ? handleCancelDealUser : handleRequestUser}
          isLoading={isLoading}
          rounded="full"
          size="sm"
          display="flex"
        >
          {isRequested
            ? "Cancel Deal"
            : isAccepted
            ? "Accept Deal"
            : "Request Deal"}
        </Button>
      ) : (
        <Button
          colorScheme={isRequested ? "gray" : "blue"}
          isLoading={isLoading}
          onClick={isRequested ? handleCancelDealUser : handleRequestUser}
        >
          {isRequested
            ? "Cancel Deal"
            : isAccepted
            ? "Accept Deal"
            : "Request Deal"}
        </Button>
      )}
    </>
  );
}

export function FollowButton({
  userId,
  authUserId,
  isMobile,
  updateFollowersCount,
}) {
  const { isFollowing, isLoading, followUser, unfollowUser } = useFollowUser(
    userId,
    authUserId
  );
  const { isFollowing: isFollowedBack } = useFollowUser(authUserId, userId); // Check if the target user follows the authenticated user
  const toast = useToast();

  const handleFollowUser = async () => {
    await followUser();
    updateFollowersCount(); // Update followers count after following a user
  };

  const handleUnfollowUser = async () => {
    await unfollowUser();
    updateFollowersCount(); // Update followers count after unfollowing a user
  };

  return (
    <>
      {isMobile ? (
        <Button
          pos="flex"
          mb=""
          ml="auto"
          colorScheme={isFollowing ? "gray" : "blue"}
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
          isLoading={isLoading}
          rounded="full"
          size="sm"
          display="flex"
        >
          {isFollowing ? "Unfollow" : isFollowedBack ? "Follow Back" : "Follow"}
        </Button>
      ) : (
        <Button
          colorScheme={isFollowing ? "gray" : "blue"}
          isLoading={isLoading}
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
        >
          {isFollowing ? "Unfollow" : isFollowedBack ? "Follow Back" : "Follow"}
        </Button>
      )}
    </>
  );
}

export default function NotificationItem({
  notification,
  deleteNotification,
  colorMode,
}) {
  const [username, setUsername] = useState("");
  const { user: authUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const fetchUsername = async () => {
      const userDocRef = doc(db, "users", notification.from);
      const businessDocRef = doc(db, "businesses", notification.from);

      const userDocSnapshot = await getDoc(userDocRef);
      const businessDocSnapshot = await getDoc(businessDocRef);
      const username = userDocSnapshot.exists()
        ? userDocSnapshot.data().username
        : businessDocSnapshot.exists()
        ? businessDocSnapshot.data().username
        : "";
      setUsername(username);
    };

    fetchUsername();
    return;
  }, [notification.from]);

  const textColor = useColorModeValue("gray.500", "gray.300");

  const getNotificationText = () => {
    switch (notification.type) {
      case "follow":
        return " started following you";
      case "deal":
        return " sent you a deal request";
      case "cancelDeal":
        return " canceled the deal";
      case "paymu":
        return notification?.title;
      case "request":
        return "You have received a request"
      // Add more cases for other notification types
      default:
        return "";
    }
  };
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const updateFollowersCount = async () => {
    try {
      const updatedCount = await getFollowersCount(user.id);
      setCount(updatedCount);
    } catch (error) {
      console.error("Error updating followers count:", error);
    }
  };
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user, isLoading: userLoading } = useUsername(username);
  const renderActionButton = () => {
    if (notification.type === "follow" && user && authUser) {
      return (
        <FollowButton
          userId={notification.from}
          authUserId={authUser.id}
          isMobile={isMobile}
          updateFollowersCount={updateFollowersCount}
        />
      );
    } else if (notification.type === "deal" && user && authUser) {
      return (
        <DealButton
          userId={notification.from}
          authUserId={authUser.id}
          isMobile={isMobile}
        />
      );
    } else if (notification.type === "paymu" && user && authUser) {
      return (
        <Button
          colorScheme={"blue"}
          onClick={() => {
            window.location.href = `${PROTECTED}/paymu`;
            deleteNotification(notification.uid, notification.from, notification.type, notification.time);
          }}
        >
          PayMu
        </Button>
      );
    } else if (notification.type === "request"){
      return (
        <Button
          colorScheme={"blue"}
          onClick={() => {
            window.location.href = `${PROTECTED}/messages/`;
            deleteNotification(notification.uid, notification.from, notification.type, notification.time);
          }}
        >
          View Request
        </Button>
      );

    }else {
      return null;
    }
  };

  return (
    <MenuItem
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      bg={colorMode === "light" ? "white" : "gray.900"}
    >
      <Box>
        <Text>
          {username && (
            <Link
              as={goToLink}
              to={`${PROTECTED}/profile/${username}`}
              color="blue.500"
              fontWeight="bold"
            >
              @{username}
            </Link>
          )}
          {username && getNotificationText()}
        </Text>
        <Wrap>
          <Text color={textColor}>
            {formatDistanceToNow(notification.time)} ago
          </Text>
          <Box>{renderActionButton()}</Box>
        </Wrap>
      </Box>

      <IconButton
        icon={<FiX />}
        size="md"
        onClick={() => {
          deleteNotification(notification.uid, notification.from, notification.type, notification.time);
        }}
              />
    </MenuItem>
  );



  

  
}


