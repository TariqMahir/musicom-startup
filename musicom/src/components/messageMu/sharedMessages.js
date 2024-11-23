import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { CaretLeft } from "phosphor-react";
import { useDispatch } from "react-redux";
import { db } from "lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { UpdateSidebarType } from "./redux/slices/app";
import MediaContent from "./mediaContent";

const SharedMessages = ({ userId, chatId }) => {
  const dispatch = useDispatch();
  const { colorMode } = useColorMode();
  const [value, setValue] = useState(0);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [sharedLinks, setSharedLinks] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);

  useEffect(() => {
    if (!userId || !chatId) return;

    const fetchSharedMessages = async () => {
      try {
        const messagesRef = collection(db, "users", userId, "chats", chatId, "timestamp");

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

    fetchSharedMessages();
  }, [userId, chatId]);

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  return (
    <Box w={470} height={"100%"} overflow="scroll">
      <Stack height={"100%"}>
        {/* Header */}
        <Box width={"100%"}>
          <Stack
            height={"100%"}
            p={2}
            direction={"row"}
            alignItems={"center"}
            spacing={3}
            backgroundColor={
              colorMode === "light" ? "gray.100" : "whiteAlpha.100"
            }
          >
            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType("CONTACT"));
              }}
              icon={<CaretLeft />}
            />
            <Text
              color={colorMode === "light" ? "black" : "white"}
              variant={"subtitle2"}
            >
              Shared Messages
            </Text>
          </Stack>
        </Box>

        <Tabs onChange={(value) => handleChange(value)} px={2}>
          <TabList>
            <Tab>Media</Tab>
            <Tab>Links</Tab>
            <Tab>Docs</Tab>
          </TabList>
          {/* Body */}
          <Stack
            height={"100%"}
            position={"relative"}
            flexGrow={1}
            p={3}
            spacing={value === 1 ? 1 : 3}
          >
            <TabPanels>
              <TabPanel>
                {/* Images */}
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
                {/* Links */}
                <Flex direction="column">
                  {sharedLinks.length > 0 ? (
                    sharedLinks.map((el, index) => (
                      <MediaContent key={index} message={el} />
                    ))
                  ) : (
                    <Text>No links found</Text>
                  )}
                </Flex>
              </TabPanel>
              <TabPanel>
                {/* Docs */}
                <Flex direction="column">
                  {sharedDocs.length > 0 ? (
                    sharedDocs.map((el, index) => (
                      <MediaContent key={index} message={el} />
                    ))
                  ) : (
                    <Text>No documents found</Text>
                  )}
                </Flex>
              </TabPanel>
            </TabPanels>
          </Stack>
        </Tabs>
      </Stack>
    </Box>
  );
};

export default SharedMessages;
