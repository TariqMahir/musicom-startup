import { SearchIcon } from "@chakra-ui/icons";
import {
  AvatarBadge,
  Box,
  Button,
  Divider,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  useColorMode,
  Avatar,
  Badge,
  useBreakpointValue,
  List,
  ListItem,
  useToast,
  Flex,
  useColorModeValue,
  Spacer,
} from "@chakra-ui/react";
import React, { Component, useEffect, useRef, useState } from "react";
import { FiArchive, FiFilter, FiMoreVertical } from "react-icons/fi";
import { TbCircleDashed } from "react-icons/tb";
import { IoFilterCircleOutline, IoFilterCircle } from "react-icons/io5";
import { ChatList } from "./buttons";
import { dispatch } from "./redux/store";
import { ToggleSidebar } from "./redux/slices/app";
import { useDispatch } from "react-redux";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "lib/firebase";
import { useAuth } from "hooks/auth";
import { useFollowUser, useUser } from "hooks/users";

const createChatAndSendEmptyMessage = async (senderRef, receiverRef) => {
  try {
    const timestamp = Date.now().toString();

    // Create references to sender's and receiver's chats
    const senderChatsRef = collection(senderRef, "chats");
    const receiverChatsRef = collection(receiverRef, "chats");

    // Create references to sender's and receiver's chat documents
    const senderChatRef = doc(senderChatsRef, receiverRef.id);
    const receiverChatRef = doc(receiverChatsRef, senderRef.id);

    // Check if the chat documents exist
    const senderChatDoc = await getDoc(senderChatRef);
    const receiverChatDoc = await getDoc(receiverChatRef);

    // Create chat documents if they don't exist
    if (!senderChatDoc.exists()) {
      await setDoc(senderChatRef, {});
    }

    if (!receiverChatDoc.exists()) {
      await setDoc(receiverChatRef, {});
    }

    // Create references to sender's and receiver's timestamp collections
    const senderTimestampRef = collection(senderChatRef, "timestamp");
    const receiverTimestampRef = collection(receiverChatRef, "timestamp");

    // Create references to sender's and receiver's timestamp documents
    const senderTimestampDocRef = doc(senderTimestampRef, timestamp);
    const receiverTimestampDocRef = doc(receiverTimestampRef, timestamp);

    // Send an empty message from the sender to the receiver
    const welcomeMessageData = {
      message: "Hello!",
      type: "msg",
      incoming: false,
      outgoing: true,
      unread: false,
      date: serverTimestamp(),
    };

    await setDoc(senderTimestampDocRef, welcomeMessageData);
    await setDoc(receiverTimestampDocRef, welcomeMessageData);
  } catch (error) {
    console.error("Error creating chat and sending empty message: ", error);
    throw error;
  }
};

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
  };

  const handleUnfollowUser = async () => {
    await unfollowUser();
  };

  return (
    <>
      {isMobile ? (
        <Button
          pos="flex"
          mb="-10"
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
          size={"xs"}
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
        >
          {isFollowing ? "Unfollow" : isFollowedBack ? "Follow Back" : "Follow"}
        </Button>
      )}
    </>
  );
}

const markMessagesAsRead = async (userId, chatId) => {
  const userRef = doc(db, "users", userId);
  const chatRef = doc(collection(userRef, "chats"), chatId);
  const messagesRef = collection(chatRef, "timestamp");

  const unreadQuery = query(messagesRef, where("unread", "==", true));
  const unreadSnapshot = await getDocs(unreadQuery);

  const batch = writeBatch(db);
  unreadSnapshot.forEach((doc) => {
    batch.update(doc.ref, { unread: false });
  });

  await batch.commit();
};

const Search = ({ chatData }) => {
  const [searchValue, setSearchValue] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { user } = useAuth();

  const handleUserClick = async (userPressedId) => {
    console.log(userPressedId);
    try {
      const senderRef = doc(
        db,
        user.businessName ? "businesses" : "users",
        user.id
      );

      const userPressedRef = doc(
        db,
        userPressedId?.businessName ? "businesses" : "users",
        userPressedId?.id
      );

      await createChatAndSendEmptyMessage(senderRef, userPressedRef);

      // Redirect to the chat or do any necessary actions after creating the chat.
    } catch (error) {
      console.error("Error handling user click: ", error);
    }
  };

  useEffect(() => {
    const fetchAndFilterUsers = async () => {
      try {
        if (!searchValue) {
          setFilteredUsers([]);
          return;
        }

        const usersCollectionRef = collection(db, "users");
        const businessesCollectionRef = collection(db, "businesses");

        // Fetch data from both collections using getDocs
        const [usersSnapshot, businessesSnapshot] = await Promise.all([
          getDocs(usersCollectionRef),
          getDocs(businessesCollectionRef),
        ]);

        const usersData = usersSnapshot.docs.map((doc) => doc.data());
        const businessesData = businessesSnapshot.docs.map((doc) => doc.data());

        // Combine both sets of users
        const allUsers = [...usersData, ...businessesData];

        // Filter users based on the search value
        const matchingUsers = allUsers.filter((user) =>
          user.username.includes(searchValue)
        );

        // Fetch current user's following list
        const currentUserRef = doc(
          db,
          user?.fullName ? "users" : "businesses",
          user?.id
        );

        const currentUserDoc = await getDoc(currentUserRef);
        const { following } = currentUserDoc.data() || {}; // Ensure following exists

        // Exclude the current user from the list of matching users
        const filteredUsers = matchingUsers
          .filter((matchingUser) => matchingUser.id !== user?.id) // Exclude current user
          .map((matchingUser) => ({
            ...matchingUser,
            isFollowing: following && following.includes(matchingUser.id),
          }))
          .filter((matchingUser) => {
            // Check if the user is not already in chatData
            return !chatData.some((chat) => chat.id === matchingUser.id);
          });

        setFilteredUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching and filtering users:", error);
      }
    };

    fetchAndFilterUsers();
  }, [searchValue, user, chatData]);

  const handleSearchInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  return (
    <div>
      <InputGroup borderRadius="xl" backgroundColor="transparent"> 
        <Input
          type="text"
          placeholder="Search for New Chat"
          color="black"
          fontSize={12}
          ml={-1}
          mb={2}
          height={"6"}
          value={searchValue}
          onChange={handleSearchInputChange}
        />
        <InputRightElement pointerEvents="none">
          <SearchIcon color="gray.300" mb={4} />
        </InputRightElement>
      </InputGroup>

      {filteredUsers.map((userr) => (
        <Stack
          direction={"row"}
          mt={2}
          mb={1}
          key={userr.id}
          onClick={() => {
            userr.isFollowing && handleUserClick(userr);
          }}
        >
          <Box
            p={1.5}
            backgroundColor={"gray.100"}
            borderRadius={"md"}
            width={"100%"}
          >
            {!userr.isFollowing ? (
              <Stack alignContent={"center"} direction={"row"}>
                <Text fontSize={"xs"}>{userr.username}</Text>
                <Flex flex={1} />
                <FollowButton
                  userId={userr.id}
                  authUserId={user.id} // Replace with the actual authenticated user's ID
                  isMobile={false} // Replace with your condition for mobile
                />
              </Stack>
            ) : (
              <Text>{userr.username}</Text>
            )}
          </Box>
        </Stack>
      ))}
    </div>
  );
};

const ChatElement = ({
  chatId,
  name,
  img,
  message: msg,
  date,
  unread,
  online,
  userPressed,
}) => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user: userr, isLoading } = useUser(chatId);

  const timestampMilliseconds = date
    ? date.seconds * 1000 + date.nanoseconds / 1e6
    : Date();

  const dateObject = new Date(timestampMilliseconds);

  const currentDate = new Date();
  const timeDifference = dateObject.getDate() - currentDate.getDate();
  let displayText;
  if (timeDifference === 0) {
    displayText = dateObject.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    displayText = dateObject.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  return (
    <Box
      width={"100%"}
      borderRadius={"lg"}
      boxShadow={"xl"}
      rounded={"lg"}
      borderWidth="0.2px"
      borderColor="rgba (72, 50,133, 0)"
      backgroundColor={
        colorMode === "light"
          ? userPressed === chatId
            ? "#6899FE"
            : "white"
          : "white"
      }
      style={{
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' // Custom CSS for shadow
      }}
      p={2}
      _hover={{ bg: "#6899FE", cursor: "pointer" }}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Box>
          <Stack direction={"row"} spacing={2} align={"center"}>
            <Avatar size={"sm"} src={userr?.avatar != "" ? userr?.avatar : ""}>
              {online && <AvatarBadge boxSize="1.75em" bg="green.500" />}
            </Avatar>
            <Stack spacing={0.3} textAlign={"left"}>
              <Text
                variant={"subtitle2"}
                as="b"
                fontWeight={"600"}
                fontSize={isMobile ? "xs" : "xs"}
              >
                {userr?.username}
              </Text>
              <Text
                variant={"caption"}
                as="p"
                fontWeight={"300"}
                fontSize={isMobile ? "xs" : "15px"}
              >
                {msg.length > 10 ? `${msg.substring(0, 10)}...` : msg}
              </Text>
            </Stack>
          </Stack>
        </Box>
        <Stack spacing={1} alignItems={"center"}>
          
          {unread ? (
            <Badge
            backgroundColor={"#447CF0"}
            color="#447CF0"  
            px={0.5}  
            py={0.1}  
            fontSize="0.4em" 
            rounded={"xl"}
          >
            1
          </Badge>
          ) : (
            <Box p={2}></Box>
          )}
          <Flex justifyContent="flex-end" mt={2}>
          <Text fontSize="2xs" color="gray.500">
            {displayText}
          </Text>
          </Flex>
        </Stack>
      </Stack>
    </Box>
  );
};

function Chats({ setUserPressed, userPressed }) {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [chatData, setChatData] = useState([]);
  const { user, isLoading } = useAuth();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false); // Step 1: State for filter

  useEffect(() => {
    if (!isLoading && user) {
      const userRef = doc(
        db,
        user?.fullName ? "users" : "businesses",
        user?.id
      );
      const chatsCollectionRef = collection(userRef, "chats");

      const unsubscribe = onSnapshot(
        chatsCollectionRef,
        async (querySnapshot) => {
          const updatedChatDataList = [...chatData];

          for (const chatDoc of querySnapshot.docs) {
            const chatId = chatDoc.id;
            const timestampCollectionRef = collection(chatDoc.ref, "timestamp");

            const timestampUnsubscribe = onSnapshot(
              timestampCollectionRef,
              (timestampQuerySnapshot) => {
                if (!timestampQuerySnapshot.empty) {
                  const lastTimestampDoc =
                    timestampQuerySnapshot.docs[
                      timestampQuerySnapshot.size - 1
                    ];
                  const timestamp = lastTimestampDoc.data();

                  if (timestamp) {
                    const existingChatIndex = updatedChatDataList.findIndex(
                      (chatData) => chatData.id === chatId
                    );

                    if (existingChatIndex !== -1) {
                      updatedChatDataList[existingChatIndex] = {
                        id: chatId,
                        data: {
                          ...timestamp,
                          chatId,
                        },
                      };
                    } else {
                      updatedChatDataList.push({
                        id: chatId,
                        data: {
                          ...timestamp,
                          chatId,
                        },
                      });
                    }

                    setChatData(updatedChatDataList);
                  }
                }
              }
            );
          }
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [user, isLoading, chatData]);

  chatData.sort((a, b) => {
    const dateA = new Date(a.data.date ? a.data.date.seconds * 1000 : 0);
    const dateB = new Date(b.data.date ? b.data.date.seconds * 1000 : 0);
    return dateB - dateA;
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleChatClick = async (chatId) => {
    setUserPressed(chatId);
    await markMessagesAsRead(user.id, chatId);
  };

  // Step 3: Filter chat data based on the filter state
  const filteredChatData = showUnreadOnly
    ? chatData.filter((chat) => chat.data.unread)
    : chatData;

  return (
    <Box
      position={"relative"}
      height={isMobile ? "87vh" : "85vh"}
      width={isMobile ? "100%" : "30%"}
      backgroundColor={colorMode === "light" ? "#fff" : "blackAlpha.300"}
      boxShadow={"sm"}
      zIndex={2}
    >
      <Stack spacing={2} p={3} height={"100%"}>
        <Stack width={"100%"}>
          <Search chatData={chatData} />
        </Stack>
        <Stack
          direction={"column"}
          flexGrow={1}
          overflow={"scroll"}
          height={"100%"}
          spacing={2}
        >
          <Stack spacing={2} overflowY="scroll">
          <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Text marginBottom={3} fontSize="14px" color="#6899FE">All Chats</Text>
          <Spacer />
          <IconButton 
            backgroundColor={"transparent"}
            icon={showUnreadOnly ? <IoFilterCircle color="#6899FE"/> : <IoFilterCircleOutline color="#6899FE"/>}
            onClick={() => setShowUnreadOnly((prev) => !prev)}
            aria-label="Filter"
            size="sm"
            _hover={{ backgroundColor: "transparent" }} 
            ml={1}
          />
          <IconButton
            backgroundColor={'transparent'}
            icon={<FiMoreVertical color="#6899FE" />} 
            size="sm"
            _hover={{ backgroundColor: "transparent" }} 
          />
        </Stack>
            {filteredChatData.map((el) => {
              return (
                <IconButton
                  
                  _hover={{ backgroundColor: "#6899FE" }}
                  onClick={() => handleChatClick(el.id)}
                  style={{ marginBottom: 15 }}
                  onDoubleClick={() => setUserPressed("")}
                >
                  <ChatElement {...el.data} userPressed={userPressed} />
                </IconButton>
              );
            })}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

export default Chats;
