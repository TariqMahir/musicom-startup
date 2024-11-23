import React, { useEffect, useState } from "react";
import { Box, Text, Stack, Flex, Button, Checkbox, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, useToast } from "@chakra-ui/react";
import { getDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "lib/firebase";
import { useAuth } from "hooks/auth";
import { GetUsernameSingleNoBusiness } from "hooks/users";

const AddMembersModal = ({ isOpen, onClose, groupData, updateGroupData }) => {
  const { user: authUser } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!authUser) return;

    const fetchFollowers = async () => {
      const userDoc = await getDoc(doc(db, "users", authUser.id));
      const userData = userDoc.data();
      setFollowers(userData.followers || []);
    };

    fetchFollowers();
  }, [authUser]);

  const handleAddMembers = async () => {
    try {
      const newMembers = [...groupData.members, ...selectedFollowers];
      const groupDocRef = doc(db, "groups", groupData.groupID);
      await updateDoc(groupDocRef, { members: newMembers });

      await Promise.all(selectedFollowers.map(async (followerId) => {
        const memberDocRef = doc(db, "users", followerId);
        await updateDoc(memberDocRef, { groups: arrayUnion(groupData.groupID) });
      }));

      updateGroupData((prev) => ({ ...prev, members: newMembers }));
      onClose();
      toast({
        title: "Members Added",
        description: "New members have been added to the group.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      console.error("Error adding members:", error);
      toast({
        title: "Error Adding Members",
        description: "An error occurred while adding new members. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const handleSelectFollower = (followerId) => {
    if (selectedFollowers.includes(followerId)) {
      setSelectedFollowers(selectedFollowers.filter(id => id !== followerId));
    } else {
      setSelectedFollowers([...selectedFollowers, followerId]);
    }
  };

  if (!authUser) return null; // Add this check to prevent accessing properties of null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Members</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          
          <Stack spacing={3}>
            {followers.map(followerId => (
              <Flex key={followerId} align="center">
                <GetUsernameSingleNoBusiness userId={followerId} />
                {/*
                    If we want to ever add make multiple group addmins in the future:
                <Checkbox
                  isChecked={selectedFollowers.includes(followerId)}
                  onChange={() => handleSelectFollower(followerId)}
                  ml={2}
                >
                Make group Admin
            </Checkbox>*/}
              </Flex>
            ))}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleAddMembers} disabled={selectedFollowers.length === 0}>
            Add Members
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};


export default AddMembersModal;