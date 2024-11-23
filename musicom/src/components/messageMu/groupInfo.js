import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
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
  useToast,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiX, FiChevronLeft, FiPlus, FiShare2 } from "react-icons/fi";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { db } from "lib/firebase";
import { useAuth } from "hooks/auth";
import GroupMediaContent from "./groupMediaContent";

export const PROTECTED = "/protected";

const GroupInfo = ({ groupId, setShowGroupInfo }) => {
  const [groupData, setGroupData] = useState(null);
  const [memberData, setMemberData] = useState({});
  const [mediaMessages, setMediaMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoteMemberId, setPromoteMemberId] = useState(null);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const toast = useToast();
  const { user: authUser } = useAuth();
  const { colorMode } = useColorMode();

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) return;
      try {
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (groupDoc.exists()) {
          setGroupData(groupDoc.data());
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      }
    };

    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!groupData) return;

      const memberDataTemp = {};
      await Promise.all(
        groupData.members.map(async (memberId) => {
          const memberDoc = await getDoc(doc(db, "users", memberId));
          if (memberDoc.exists()) {
            memberDataTemp[memberId] = memberDoc.data();
          }
        })
      );
      setMemberData(memberDataTemp);
      setLoading(false);
    };

    fetchMemberData();
  }, [groupData]);

  useEffect(() => {
    const fetchMediaMessages = async () => {
      if (!groupId) return;
      try {
        const messagesRef = collection(db, "groups", groupId, "messages");
        const mediaQuery = query(messagesRef, where("subtype", "in", ["doc", "img", "link"]));
        const mediaDocs = await getDocs(mediaQuery);
        const mediaMessagesTemp = mediaDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMediaMessages(mediaMessagesTemp);
      } catch (error) {
        console.error("Error fetching media messages:", error);
      }
    };

    fetchMediaMessages();
  }, [groupId]);

  const [value, setValue] = useState(0);
  const handleChange = (newValue) => {
    setValue(newValue);
  };

  const confirmRemoveMember = async () => {
    await removeFromGroup(memberToRemove);
    setIsConfirmationModalOpen(false);
    setMemberToRemove(null);
  };

  const isMobile = useBreakpointValue({ base: true, md: false });

  const removeFromGroup = async (memberId) => {
    if (!groupData || !groupId) return;

    const isRemovingSelf = memberId === authUser.id;
    const remainingAdmins = Object.values(groupData.roles).filter(role => role === 'admin').length;

    if (isRemovingSelf && remainingAdmins <= 1) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot remove yourself as the only admin. Please assign another admin first.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const newMembers = groupData.members.filter(id => id !== memberId);
      const { [memberId]: _, ...newRoles } = groupData.roles; // Remove member from roles

      const groupDocRef = doc(db, "groups", groupId);
      await updateDoc(groupDocRef, { members: newMembers, roles: newRoles });

      const memberDocRef = doc(db, "users", memberId);
      await updateDoc(memberDocRef, { groups: arrayRemove(groupId) });

      setGroupData((prev) => ({ ...prev, members: newMembers, roles: newRoles }));
      setMemberData((prev) => {
        const newMemberData = { ...prev };
        delete newMemberData[memberId];
        return newMemberData;
      });

      toast({
        title: "Member removed",
        description: `${memberData[memberId]?.username} has been removed from the group.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      console.error("Error removing from group:", error);
      toast({
        title: "Error removing member",
        description: "An error occurred while removing the member. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const handleRemoveMember = (memberId) => {
    setMemberToRemove(memberId);
    setIsConfirmationModalOpen(true);
  };

  if (!groupData || !authUser) {
    return <Text>Loading group information...</Text>;
  }

  const isAdmin = groupData.roles[authUser?.id] === 'admin';

  return (
    <Box
      width={ isMobile ? "100vw" : "100%" }
      borderRadius="md"
      mx="auto"
      height={"100%"}
      borderRight={ isMobile ? "" : "1px solid #E2E8F0" }
    >
      {/* Header */}
      <Box 
        width={"100%"} 
        borderTop="1px #E2E8F0 solid" 
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
            onClick={() => setShowGroupInfo(false)}
            icon={<FiChevronLeft color="#6899FE"/>}
            backgroundColor={"transparent"}
            size="lg"
            _hover={{ backgroundColor: "transparent" }}
          />
          <Text
            fontSize="xl"
            as="b"
          >
            Group Information
          </Text>
        </Stack>
      </Box>
      <Box 
        width={"100%"} 
        borderTop="1px #E2E8F0 solid" 
        backgroundColor={'#transparent'}
        p={2}
        height={'15%'}
      >
          <Heading size="md">{groupData.groupName} </Heading>
      </Box>
  
      {/* Body */}
      <Stack
        height={"90%"}
        position={"relative"}
        flexGrow={1}
        overflowY={"scroll"}
      >
        {/* Media, Links, Docs */}
        <Stack
          direction={"column"}
          height={"45%"}
          borderTop="1px #E2E8F0 solid"
          borderBottom="1px #E2E8F0 solid"
        >
          <Tabs onChange={(value) => handleChange(value)} variant="unstyled" overflowY={"scroll"}>
            <TabList borderBottom="1px solid #E2E8F0">
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
                  {mediaMessages.filter(el => el.subtype === "img").length > 0 ? (
                    mediaMessages.filter(el => el.subtype === "img").map((el, index) => (
                      <GroupMediaContent key={index} message={el} />
                    ))
                  ) : (
                    <Text>No media found</Text>
                  )}
                </SimpleGrid>
              </TabPanel>
              <TabPanel>
                <SimpleGrid columns={3} spacing={2}>
                  {mediaMessages.filter(el => el.subtype === "link").length > 0 ? (
                    mediaMessages.filter(el => el.subtype === "link").map((el, index) => (
                      <GroupMediaContent key={index} message={el} />
                    ))
                  ) : (
                    <Text>No links found</Text>
                  )}
                </SimpleGrid>
              </TabPanel>
              <TabPanel>
                <SimpleGrid row={3} spacing={2}>
                  {mediaMessages.filter(el => el.subtype === "doc").length > 0 ? (
                    mediaMessages.filter(el => el.subtype === "doc").map((el, index) => (
                      <GroupMediaContent key={index} message={el} />
                    ))
                  ) : (
                    <Text>No documents found</Text>
                  )}
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Stack>
  
        <Stack spacing={3} maxHeight="300px" overflowY="auto" >
        <Heading p={2} height={'5%'} size="sm">Group Members</Heading>
          {loading ? (
            <Text>Loading members...</Text>
          ) : (
            groupData.members.map((memberId) => {
              const user = memberData[memberId];
              if (!user) return null;
              const isAdminMember = groupData.roles[memberId] === 'admin';
              return (
                <Flex key={memberId} align="center" justify="space-between" p={2}>
                  <Flex align="center">
                    <Avatar as={Link}
                  href={`${PROTECTED}/profile/${user.username}`} src={user.avatar} size="sm" mr={2} />
                    <Text as={Link}
                  href={`${PROTECTED}/profile/${user.username}`} fontWeight="bold">{user.username}</Text>
                    {isAdminMember && (
                      <Text ml={1} fontSize="sm" color="gray.500">(Admin)</Text>
                    )}
                  </Flex>
                  {isAdmin && (
                    <Button ml={2} onClick={() => handleRemoveMember(memberId)} size="sm" colorScheme="red" variant="ghost">
                      Remove
                    </Button>
                  )}
                </Flex>
              );
            })
          )}
        </Stack>
  
        <Modal isOpen={isConfirmationModalOpen} onClose={() => setIsConfirmationModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Removal</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Are you sure you want to remove this member from the group?</Text>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="red" onClick={confirmRemoveMember}>Remove</Button>
              <Button variant="ghost" onClick={() => setIsConfirmationModalOpen(false)}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Stack>
    </Box>
  );
};

export default GroupInfo;
