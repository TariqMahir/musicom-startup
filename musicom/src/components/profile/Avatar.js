import { Avatar as ChakraAvatar, Box, Badge } from "@chakra-ui/react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "lib/firebase";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PROTECTED } from "lib/routes";
import { useAuth } from "hooks/auth";

export default function Avatar({
  user,
  size = "xl",
  overrideAvatar = null,
  post = false,
}) {
  const username = user?.username;
  const { user: authUser } = useAuth();
  const avatar = user?.avatar;
  const [subscribed, setSubscribed] = useState(null);
  const location = useLocation();

  const getActiveSubscription = async (user) => {
    try {
      const snapshot = await getDocs(
        query(
          collection(
            db,
            user?.businessName ? "businesses" : "users",
            user?.id,
            "subscriptions"
          ),
          where("status", "in", ["trialing", "active"])
        )
      );

      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        return doc.data().status;
      } else {
        console.log("No active or trialing subscription found.");
        return null;
      }
    } catch (error) {
      console.error("Error getting active subscription:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getActiveSubscription(user);
        setSubscribed(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [user?.id]);

  const proSize = !post ? "sm" : "3xs";

  return (
    <Box position="relative" display="inline-block">
      <ChakraAvatar
        as={Link}
        to={`${PROTECTED}/profile/${username}`}
        size={size}
        src={overrideAvatar || avatar || ""}
        _hover={{ cursor: "pointer", opacity: "0.8" }}
      />
      {subscribed && (
        <Badge
          position="absolute"
          bottom="0"
          left={post ? "5" : "0"}
          fontSize={proSize}
          backgroundColor="orange"
          color={"white"}
          zIndex="1" // Ensure the badge is above the avatar
        >
          PRO
        </Badge>
      )}
    </Box>
  );
}
