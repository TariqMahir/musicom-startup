import { AtSignIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Box,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Checkbox,
  Text,
  Button,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { doc, getDoc, collection, addDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { useToast } from "@chakra-ui/react";
import { useAuth } from "hooks/auth";
import { db } from "lib/firebase";
import { GetUsernameSingleNoBusiness } from "hooks/users";

const CreateGroup = ({ userId, authUserId, open, handleClose }) => {
  const { handleSubmit, register, setValue, errors } = useForm();
  const [selectedFollowers, setSelectedFollowers] = useState([]);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { user: authUser } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [isError, setIsError] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const maxGroupMembers = 9;
  const isCreateButtonDisabled = selectedFollowers.length >= maxGroupMembers || selectedFollowers.length === 0;

  useEffect(() => {
    const fetchMutualFollowers = async () => {
      const authUserDoc = await getDoc(doc(db, "users", authUser.id));
      const authUserData = authUserDoc.data();

      const mutualFollowersList = authUserData.followers.filter((follower) =>
        authUserData.following.includes(follower)
      );

      setMutualFollowers(mutualFollowersList);
    };

    if (authUser) {
      fetchMutualFollowers();
    }
  }, [authUser]);

  const handleCreateGroup = async () => {
    if (!isCreateButtonDisabled && groupName) {
      try {
        setIsLoading(true);

        // Create a new group in Firebase
        const groupsCollection = collection(db, "groups");
        const newGroupDocRef = await addDoc(groupsCollection, {
          groupName: groupName,
          members: [authUser.id, ...selectedFollowers],
          roles: {
            [authUser.id]: 'admin',
            ...selectedAdmins.reduce((acc, adminId) => {
              acc[adminId] = 'admin';
              return acc;
            }, {}),
          },
          createdAt: Timestamp.now(),
          createdBy: authUser.id,
        });
        const groupID = newGroupDocRef.id;

        await updateDoc(newGroupDocRef, { groupID: groupID });

        const messagesSubcollectionRef = collection(newGroupDocRef, "messages");
        await addDoc(messagesSubcollectionRef, {
          sentBy: authUser.id,
          message: `${authUser.username} added to '${groupName}' group chat`,
          createdAt: Timestamp.now(),
          type: "msg"
        });

        // Update the 'groups' field for each member, including the authenticated user and selected followers
        const membersToUpdate = [authUser.id, ...selectedFollowers];
        await Promise.all(membersToUpdate.map(async memberID => {
          const memberDocRef = doc(db, "users", memberID);
          const memberData = await getDoc(memberDocRef);
          const memberGroups = memberData.data()?.groups || [];
          await updateDoc(memberDocRef, {
            groups: [groupID, ...memberGroups],
          });
        }));

        setIsLoading(false);
        toast({
          title: "Group Created",
          description: `Group '${groupName}' created successfully.`,
          status: "success",
          isClosable: true,
          position: "top",
          duration: 5000,
        });
        handleClose();
      } catch (error) {
        console.error("Error creating group:", error);
        setIsLoading(false);
        toast({
          title: "Failed to create group",
          description: "An error occurred while creating the group. Please try again.",
          status: "error",
          isClosable: true,
          position: "top",
          duration: 5000,
        });
      }
    } else {
      if (!groupName) {
        setIsError(true); // Handle case where group name is missing
      }
    }
  };

  const handleSelectFollower = (follower) => {
    if (selectedFollowers.length >= maxGroupMembers && !selectedFollowers.includes(follower)) {
      toast({
        title: "Group member limit reached",
        description: `You can't add more than ${maxGroupMembers} members to a group.`,
        status: "warning",
        duration: 1500,
        isClosable: true,
        position: "top",
      });
      return; // Prevent adding more followers
    }

    const isFollowerSelected = selectedFollowers.includes(follower);
    if (isFollowerSelected) {
      setSelectedFollowers(selectedFollowers.filter((selectedFollower) => selectedFollower !== follower));
      setSelectedAdmins(selectedAdmins.filter((admin) => admin !== follower)); // Remove from admin if deselected
    } else {
      setSelectedFollowers([...selectedFollowers, follower]);
    }
  };

  const handleSelectAdmin = (follower) => {
    const isAdminSelected = selectedAdmins.includes(follower);
    if (isAdminSelected) {
      setSelectedAdmins(selectedAdmins.filter((admin) => admin !== follower));
    } else {
      setSelectedAdmins([...selectedAdmins, follower]);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Group</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel>Select group members from your Friends</FormLabel>
            <Box
              style={{
                maxHeight: "300px",
                maxWidth: "auto",
                overflowY: "scroll",
                border: "1px solid #ccc",
                borderRadius: "5px",
                padding: "8px",
              }}
            >
              {mutualFollowers.map((follower) => (
                <Box key={follower}>
                  <Flex align="center" justify="space-between">
                    <GetUsernameSingleNoBusiness
                      handleSelectFollower={handleSelectFollower}
                      selectedFollowers={selectedFollowers}
                      setSelectedFollowers={setSelectedFollowers}
                      userId={follower}
                    />
                    
                    {/*
                    If we want to ever add make multiple group addmins in the future:
                    <Checkbox
                      isChecked={selectedAdmins.includes(follower)}
                      onChange={() => handleSelectAdmin(follower)}
                    >
                      Make group admin
              </Checkbox>*/}
                  </Flex>
                </Box>
              ))}
            </Box>
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Group Name</FormLabel>
            <InputGroup>
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={20}
              />
              {groupName.length >= 20 && (
                <InputRightElement color="blue.500" children="✓" />
              )}
            </InputGroup>
            {groupName.length >= 20 && (
              <FormHelperText color="blue.500">Maximum characters reached</FormHelperText>
            )}
          </FormControl>
        </ModalBody>

        <ModalFooter style={{ display: "flex", justifyContent: "center" }}>
          <IconButton
            backgroundColor={isCreateButtonDisabled ? "white" : "#1041B2"}
            width={20}
            height={10}
            onClick={handleCreateGroup}
            disabled={isCreateButtonDisabled}
            style={{ pointerEvents: isCreateButtonDisabled ? "none" : "auto" }}
          >
            <Text color={"Black"}>
              {isCreateButtonDisabled ? "Please choose at most 8 users to create a group." : "Create"}
            </Text>
          </IconButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateGroup;
