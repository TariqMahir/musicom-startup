import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Image,
  Stack,
  Text,
  useColorMode,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { FiX, FiChevronLeft } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { ToggleSidebar, UpdateSidebarType } from "./redux/slices/app";
import { CaretRight } from "phosphor-react";
import { db } from "lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuth } from "hooks/auth";
import { useUser } from "hooks/users"; // Assuming useUser is a custom hook for fetching user data
import MediaContent from "./mediaContent";

const Contact = ({ userPressed }) => {
  const dispatch = useDispatch();
  const { colorMode } = useColorMode();
  const { user: authUser } = useAuth();
  const { user: userr, isLoading: isLoadingUserr } = useUser(userPressed);
  const [sharedGroups, setSharedGroups] = useState([]);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [sharedLinks, setSharedLinks] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const fetchSharedGroups = async () => {
      if (!authUser?.id || !userPressed) return;
      try {
        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("members", "array-contains", authUser.id));
        const querySnapshot = await getDocs(q);
        const groups = [];
        querySnapshot.forEach((doc) => {
          const group = doc.data();
          if (group.members.includes(userPressed)) {
            groups.push(group);
          }
        });
        setSharedGroups(groups);
      } catch (error) {
        console.error("Error fetching shared groups: ", error);
      }
    };

    const fetchSharedMessages = async () => {
      if (!authUser?.id || !userPressed) return;

      try {
        const messagesRef = collection(db, "users", authUser.id, "chats", userPressed, "timestamp");

        // Fetch shared media
        const mediaQuery = query(messagesRef, where("subtype", "==", "img"));
        const mediaSnapshot = await getDocs(mediaQuery);
        setSharedMedia(mediaSnapshot.docs.map((doc) => doc.data()));

        // Fetch shared links
        const linksQuery = query(messagesRef, where("subtype", "==", "link"));
        const linksSnapshot = await getDocs(linksQuery);
        setSharedLinks(linksSnapshot.docs.map((doc) => doc.data()));

        // Fetch shared docs
        const docsQuery = query(messagesRef, where("subtype", "==", "doc"));
        const docsSnapshot = await getDocs(docsQuery);
        setSharedDocs(docsSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching shared messages:", error);
      }
    };

    fetchSharedGroups();
    fetchSharedMessages();
  }, [authUser, userPressed]);

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  if (isLoadingUserr) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box width={"40%"} height={"100%"}>
      <Stack height={"100%"}>
        {/* Header */}
        <Box 
            width={"100%"} 
            border="1px #E2E8F0 solid" 
            backgroundColor={'#transparent'}
            p={2}
            height={'10%'}
          >
          <Stack
            height={"100%"}
            
            direction={"row"}
            alignItems={"center"}
            
          >
            <IconButton
              onClick={() => {
                dispatch(ToggleSidebar());
              }}
              icon={<FiChevronLeft color="#6899FE"/>}
              backgroundColor={"transparent"}
              size="lg"
              _hover={{ backgroundColor: "transparent" }}
            />
            <Text
              fontSize="xl"
              as="b"
            >
              Profile Information
            </Text>
          </Stack>
        </Box>
        {/* Body */}
        <Stack
          height={"90%"}
          position={"relative"}
          flexGrow={1}
          overflowY={"scroll"}
          spacing={3}
        >
          {/* Avater and name */}
          <Stack alignItems={"center"} direction={"row"}>
            <Avatar src={userr?.avatar} alt="Name" height={12} width={12} />
            <Stack spacing={0.5}>
              <Text variant={"article"} fontWeight={600}>
                {userr?.fullName
                  ? userr.fullName
                  : userr?.businessName
                  ? userr.businessName
                  : "Error"}
              </Text>
            </Stack>
          </Stack>
        
        {/* Common Groups */}        
        <Stack
          height={"45%"}
          overflowY={"scroll"}
          borderTop="1px #E2E8F0 solid"
          borderBottom="1px #E2E8F0 solid"
          p={1}
        ><Heading fontSize="sm" align="center">Groups in Common</Heading>
              {sharedGroups.map((group, index) => (
                <Box
                  key={index}
                  p={2}
                  borderRadius="lg"
                  backgroundColor={colorMode === "light" ? "gray.100" : "whiteAlpha.100"}
                  _hover={{ bg: "gray.200"}}
                >
                  <Stack direction={"row"} spacing={2} alignItems={"center"}>
                    <Stack spacing={0.5}>
                      <Text variant={"subtitle2"}>{group.groupName}</Text>
                    </Stack>
                  </Stack>
                </Box>
              ))}
        </Stack>
        {/* Media, Links, Docs */}
        <Stack
          direction={"column"}
          height={"45%"}
          borderTop="1px #E2E8F0 solid"
          borderBottom="1px #E2E8F0 solid"
          
        >
          <Tabs onChange={(value) => handleChange(value)} variant="unstyled" overflowY={"scroll"}>
            <TabList borderBottom="1px solid #E2E8F0" >
              <Tab
                _selected={{ color: "white", bg: "#6899FE" }}
                _focus={{ boxShadow: "none" }}
                borderRight="1px solid #E2E8F0"
                width="33.33%"
              >
                Media
              </Tab>
              <Tab
                _selected={{ color: "white", bg: "#6899FE" }}
                _focus={{ boxShadow: "none" }}
                borderRight="1px solid #E2E8F0"
                width="33.33%"
              >
                Links
              </Tab>
              <Tab
                _selected={{ color: "white", bg: "#6899FE" }}
                _focus={{ boxShadow: "none" }}
                width="33.33%"
              >
                Docs
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <SimpleGrid columns={3} spacing={2}>
                  {sharedMedia.length > 0 ? (
                    sharedMedia.map((el, index) => (
                      <MediaContent key={index} message={el} />
                    ))
                  ) : (
                    <Text>No media found</Text>
                  )}
                </SimpleGrid>
              </TabPanel>
              <TabPanel>
                <SimpleGrid columns={3} spacing={2}>
                  {sharedLinks.length > 0 ? (
                    sharedLinks.map((el, index) => (
                      <MediaContent key={index} message={el} />
                    ))
                  ) : (
                    <Text>No links found</Text>
                  )}
                </SimpleGrid>
              </TabPanel>
              <TabPanel>
                <SimpleGrid row={3} spacing={2}>
                  {sharedDocs.length > 0 ? (
                    sharedDocs.map((el, index) => (
                      <MediaContent key={index} message={el} />
                    ))
                  ) : (
                    <Text>No documents found</Text>
                  )}
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Contact;
