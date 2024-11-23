import React, { useState, useEffect } from "react";
// import BgImage from "./forums-bg.svg";
import BgImage from "./assets/forums-bg.svg";
import PlaceHolderOne from "./assets/placeholder1.jpg";
import PlaceHolderTwo from "./assets/placehoder2.jpg";
import NextIndicator from "./assets/next-indicator.png";
import SortIcon from "./assets/sort.png";
import {
  Menu,
  useDisclosure,
  Link,
  Modal,
  FormControl,
  FormLabel,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  IconButton,
  Container,
  Flex,
  Box,
  Image,
  Divider,
  Text,
  Stack,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import {
  FaCog,
  FaArrowUp,
  FaArrowDown,
  FaComment,
  FaSearch,
  FaShare,
} from "react-icons/fa";
import { FiMoreVertical } from "react-icons/fi";
import { SearchIcon } from "@chakra-ui/icons";
import { FORUMS } from "lib/routes";
import { useAuth } from "hooks/auth";
import { app, db, auth, storage, firestore } from "lib/firebase";
import {
  collection,
  addDoc,
  getDoc,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "@firebase/firestore";
import { PROTECTED } from "lib/routes";
import { Spinner } from "@chakra-ui/react";
import { transform } from "typescript";

function Loading() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  return (
    <Stack>
      <Text fontSize={isMobile ? "xl" : "2xl"}>
        Loading <Spinner size="md" color="blue.500" />
      </Text>
    </Stack>
  );
}

function Comment({ user, text }) {
  return (
    <Box mt="2" p="2" bg="gray.100" borderRadius="md">
      <Button
        color="blue.500"
        as={Link}
        to={`${PROTECTED}/profile/${user}`}
        colorScheme={"#1041B2"}
        variant="link"
      >
        {user}
      </Button>
      <Text>{text}</Text>
    </Box>
  );
}

function Posts({
  members,
  forumTitle,
  forumId,
  postId,
  user,
  post,
  upvotes,
  createdAt,
  isFirstPost,
  totalVotes,
}) {
  const [showShare, setShowShare] = useState(false);
  const [votes, setVotes] = useState(upvotes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const authUser = useAuth();

  const [userVote, setUserVote] = useState(null);
  const [postComments, setPostComments] = useState([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedPost, setEditedPost] = useState(post);

  const isPostOwner = authUser?.user?.username === user;

  const isMember = members?.includes(auth?.currentUser?.uid);

  const handleEditPost = () => {
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      await updateDoc(postDocRef, { post: editedPost });
      setEditModalOpen(false);

      window.location.reload();
    } catch (error) {
      console.error("Error editing post: ", error);
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
  };

  const handleDeletePost = async () => {
    try {
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      await deleteDoc(postDocRef);
      // Update the UI to reflect the deleted post
      // You might want to remove the post from the local state or refetch the posts
      window.location.reload();
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      const commentsCollectionRef = collection(postDocRef, "comments");
      const commentsSnapshot = await getDocs(commentsCollectionRef);
      const commentsData = commentsSnapshot.docs.map((doc) => doc.data());
      setPostComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async () => {
    if (commentText.trim() === "") {
      return;
    }

    try {
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      const commentsCollectionRef = collection(postDocRef, "comments");

      await addDoc(commentsCollectionRef, {
        user: authUser?.user?.username,
        text: commentText,
        createdAt: serverTimestamp(),
      });

      setPostComments((prevComments) => [
        ...prevComments,
        { user: authUser?.user?.username, text: commentText },
      ]);

      setCommentText("");
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  useEffect(() => {
    const fetchUserVote = async () => {
      if (!authUser?.user) return;

      const userVoteDocRef = doc(
        db,
        "userVotes",
        `${authUser?.user?.uid}_${postId}`
      );
      const userVoteDocSnap = await getDoc(userVoteDocRef);

      if (userVoteDocSnap.exists()) {
        setUserVote(userVoteDocSnap.data().voteType);
      } else {
        setUserVote(null);
      }
    };

    fetchUserVote();
  }, [postId, authUser?.user]);

  const joinForum = async () => {
    try {
      const forumDocRef = doc(db, "forums", forumId);
      const forumDoc = await getDoc(forumDocRef);

      if (forumDoc.exists()) {
        const forumData = forumDoc.data();
        const currentMembers = forumData.members || [];

        // Check if the user is already a member
        if (!currentMembers.includes(auth?.currentUser?.uid)) {
          // Add user's UID to the members array
          currentMembers.push(auth?.currentUser?.uid);

          // Update the members array in the database
          await updateDoc(forumDocRef, { members: currentMembers });

          // Update the local state to reflect the change
        }
      }

      window.location.reload();
    } catch (error) {
      console.error("Error joining forum: ", error);
    }
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    //weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(createdAt);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const backgroundColor = isFirstPost ? "white" : "#6899FE"; // make first post white, otherwise musicom blue
  const textColor = isFirstPost ? "black" : "white";

  return (
    <Box
      p="0"
      pr={{ base: 0, md: 10 }}
      pl={{ base: 0, md: 10 }}
      mr={{ base: 0, md: 30 }}
      ml={{ base: 0, md: 30 }}
      bg={backgroundColor}
      border={{ base: "0.5px solid blue", md: "2px solid #6899FE" }}
      borderRadius="md"
      position="relative"
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        mt={{ base: -2, md: 0 }}
        padding={isMobile ? "5px 10px" : ""}
      >
        <Flex>
          <Stack spacing="1">
            <IconButton
              mt={2}
              icon={<FaArrowUp />}
              variant="ghost"
              size="10px"
              colorScheme="blue"
              _hover={{
                backgroundColor: "#6899FE",
              }}
            />
            <Text
              fontSize="10px"
              fontWeight="bold"
              textAlign="center"
              color={textColor}
            >
              {totalVotes}
            </Text>
            <IconButton
              icon={<FaArrowDown />}
              variant="ghost"
              size="10px"
              colorScheme="blue"
              _hover={{
                backgroundColor: "#6899FE",
              }}
            />
          </Stack>
        </Flex>
        <Box flex="1" ml="4">
          <Flex justifyContent="space-between"></Flex>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            color="gray.500"
            mt="1"
          >
            <Text
              fontSize={{ base: "sm", md: "xl" }}
              fontWeight="600"
              color={textColor}
              mt={3}
            >
              <Link href={`/protected/forums/${forumTitle}/${forumId}`}>
                {forumTitle}
              </Link>
            </Text>
            {isPostOwner && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FiMoreVertical />}
                  variant="ghost"
                  size="sm"
                  colorScheme="gray"
                />
                <MenuList>
                  <MenuItem onClick={handleEditPost}>Edit Post</MenuItem>
                  <MenuItem onClick={handleDeletePost}>Delete Post</MenuItem>
                </MenuList>
              </Menu>
            )}
            {isMember ? (
              <></>
            ) : (
              <Button
                backgroundColor={"green"}
                colorScheme={"green"}
                border={"1px solid white"}
                mt={3}
                size={{ base: "xs", md: "sm" }}
                onClick={() => joinForum(forumId)}
              >
                Join
              </Button>
            )}
          </Flex>
          <Text fontSize="md"></Text>
          <Flex
            justifyContent="space-between"
            alignItems="center"
            mt="2"
            color="white"
          ></Flex>
        </Box>
      </Flex>
      {!isMobile && <Divider mt={{ base: 1, md: 2 }} />}
      <Modal isOpen={editModalOpen} onClose={handleCancelEdit}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editedPost}
              onChange={(e) => setEditedPost(e.target.value)}
              placeholder="Edit your post..."
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSaveEdit}>
              Save
            </Button>
            <Button variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function Forum({ id, title, owner, members, posts }) {
  return (
    <Box
      p={"5px 0px"}
      bg="white"
      boxShadow="sm"
      mb="4"
      borderRadius="md"
      position="relative"
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Text>
          <Link
            href={`/protected/forums/${title}/${id}`}
            fontSize="md"
            fontWeight="bold"
            color="blue.500"
          >
            {title}
          </Link>
        </Text>
        <Text color="grey" size="sm">
          {members?.length + " members"}
        </Text>
      </Flex>
      {/* Rest of the forum details */}
    </Box>
  );
}

function ForumPage() {
  const authUser = useAuth();
  const [forumTitle, setForumTitle] = useState("");
  const [forums, setForums] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isMyForumsModalOpen, setIsMyForumsModalOpen] = useState(false);
  const [userJoinedForums, setUserJoinedForums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("upvotes");
  const forumVotes = {};

  posts.forEach((post) => {
    if (!forumVotes[post.forumId]) {
      forumVotes[post.forumId] = 0;
    }
    forumVotes[post.forumId] += post.upvotes;
  });

  const uid = auth.currentUser.uid;

  const [isCreateForumModalOpen, setIsCreateForumModalOpen] = useState(false);

  const openCreateForumModal = () => {
    setIsCreateForumModalOpen(true);
  };

  const closeCreateForumModal = () => {
    setIsCreateForumModalOpen(false);
  };

  const createForum = async () => {
    if (forumTitle.trim() === "") {
      return;
    }

    try {
      const forumRef = await addDoc(collection(db, "forums"), {
        title: forumTitle,
        owner: uid,
        members: [uid],
      });

      // Clear the forum title input and close the modal
      setForumTitle("");
      closeCreateForumModal();
      window.location.reload();
    } catch (error) {
      console.error("Error creating forum: ", error);
    }
  };

  // Fetch forums from Firestore and update the state
  useEffect(() => {
    const fetchForums = async () => {
      try {
        const forumsCollectionRef = collection(db, "forums");
        const forumsSnapshot = await getDocs(forumsCollectionRef);
        const forumsData = forumsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setForums(forumsData);
      } catch (error) {
        console.error("Error fetching forums: ", error);
      }
    };

    fetchForums();
  }, []);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const allPosts = [];

        for (const forum of forums) {
          const postsCollectionRef = collection(
            db,
            "forums",
            forum.id,
            "posts"
          );
          const postsSnapshot = await getDocs(postsCollectionRef);
          const postsData = postsSnapshot.docs.map((doc) => ({
            forumId: forum.id,
            forumTitle: forum.title,
            members: forum.members,

            postId: doc.id,
            ...doc.data(),
          }));
          allPosts.push(...postsData);
        }

        const dateNow = new Date();
        const oneWeekAgo = new Date(
          dateNow.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        // Sort posts by highest of the week
        fetchSortPosts();
      } catch (error) {
        console.error("Error fetching posts: ", error);
      }
    };

    fetchAllPosts();
  }, [forums]);

  useEffect(() => {
    const fetchUserJoinedForums = async () => {
      try {
        const userJoinedForumsData = [];

        for (const forum of forums) {
          const forumDocRef = doc(db, "forums", forum.id);
          const forumDoc = await getDoc(forumDocRef);

          if (forumDoc.exists()) {
            const forumData = forumDoc.data();
            const currentMembers = forumData.members || [];

            if (currentMembers.includes(uid)) {
              userJoinedForumsData.push(forum);
            }
          }
        }

        setUserJoinedForums(userJoinedForumsData);
      } catch (error) {
        console.error("Error fetching user joined forums: ", error);
      }
    };

    fetchUserJoinedForums();
  }, [uid, forums]);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (error) {
        console.error("Error fetching forums: ", error);
      }
    };

    fetchForums();
  }, []);

  const openMyForumsModal = () => {
    setIsMyForumsModalOpen(true);
  };

  // Function to close My Forums modal
  const closeMyForumsModal = () => {
    setIsMyForumsModalOpen(false);
  };
  // Filter forums to show only those owned by the authenticated user
  const userForums = forums.filter((forum) => forum.owner === uid);

  // Initialize filterPost as an empty string
  const [filterPost, setFilterPost] = useState("");
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Use the filter method to filter posts based on the filterPost value
  const uniqueForumTitles = new Set();
  const filterForums = posts.filter((post) => {
    const lowerCaseTitle = post.forumTitle.toLowerCase();

    // Check if the title is unique before including it in the filtered array
    if (!uniqueForumTitles.has(lowerCaseTitle)) {
      uniqueForumTitles.add(lowerCaseTitle);
      return lowerCaseTitle.includes(filterPost.toLowerCase());
    }

    return false;
  });

  // Handle the search input change
  const handleSearchInputChange = (e) => {
    // Convert the input value to lowercase
    const inputValue = e.target.value.toLowerCase();

    // Update the filterPost state with the lowercase input value
    setFilterPost(inputValue);

    // You might have a setSearchQuery function to update the search query elsewhere
    setSearchQuery(inputValue);
  };

  const [sortBy, setSortBy] = useState("highest-of-the-week"); //sort by highest upvote first

  const handleSortOptionChange = (option) => {
    setSortBy(option);
  };

  useEffect(() => {
    fetchSortPosts();
  }, [sortBy]);

  const fetchSortPosts = async () => {
    try {
      const allPosts = [];
      const forumVotes = {};

      for (const forum of forums) {
        const postsCollectionRef = collection(db, "forums", forum.id, "posts");
        const postsSnapshot = await getDocs(postsCollectionRef);
        const postsData = postsSnapshot.docs.map((doc) => ({
          forumId: forum.id,
          forumTitle: forum.title,
          members: forum.members,
          postId: doc.id,
          ...doc.data(),
        }));
        allPosts.push(...postsData);

        const forumTotalVotes = postsData.reduce(
          (sum, post) => sum + (post.upvotes || 0),
          0
        );
        forumVotes[forum.id] = forumTotalVotes;
      }

      const dateNow = new Date();
      const oneWeekAgo = new Date(dateNow.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(
        dateNow.getFullYear(),
        dateNow.getMonth() - 1,
        dateNow.getDate()
      );
      const oneYearAgo = new Date(
        dateNow.getFullYear() - 1,
        dateNow.getMonth(),
        dateNow.getDate()
      );

      let sortedPosts;
      if (sortBy === "highest-of-all-time") {
        sortedPosts = allPosts.sort(
          (a, b) => forumVotes[b.forumId] - forumVotes[a.forumId]
        );
      } else if (sortBy === "highest-of-the-week") {
        sortedPosts = allPosts
          .filter((post) => post.createdAt.toDate() >= oneWeekAgo)
          .sort((a, b) => forumVotes[b.forumId] - forumVotes[a.forumId]);
      } else if (sortBy === "highest-of-the-month") {
        sortedPosts = allPosts
          .filter((post) => post.createdAt.toDate() >= oneMonthAgo)
          .sort((a, b) => forumVotes[b.forumId] - forumVotes[a.forumId]);
      } else if (sortBy === "highest-of-the-year") {
        sortedPosts = allPosts
          .filter((post) => post.createdAt.toDate() >= oneYearAgo)
          .sort((a, b) => forumVotes[b.forumId] - forumVotes[a.forumId]);
      } else if (sortBy === "latest") {
        sortedPosts = allPosts.sort(
          (a, b) => b.createdAt.toDate() - a.createdAt.toDate()
        );
      }

      setPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  return (
    <>
      {!isMobile && (
        <HStack
          backgroundImage={BgImage}
          backgroundRepeat={"no-repeat"}
          backgroundSize={"cover"}
          height={"100vh"}
        >
          <Container
            width={"container.md"}
            maxW="container.md"
            mt="50px"
            border={"1px solid #6899FE"}
            backgroundColor={"white"}
            height={"100vh"}
          >
            <Flex
              flexDirection={["column", "column", "row"]}
              justifyContent="space-between"
              alignItems={["center", "center", "flex-start"]}
              mb="0"
              p="3"
              boxShadow="sm"
              borderRadius="md"
              marginTop="20"
            >
              <Box
                display="flex"
                flex={1}
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  mb={6}
                  fontWeight={"bold"}
                  fontSize={"22px"}
                  mt={-20}
                  px={"10px"}
                  color={"#6899FE"}
                  backgroundColor={"#D9D9D9AB"}
                >
                  Communities
                </Text>

                <InputGroup w={"85%"} ml={"10px"}>
                  <Input
                    border={"1px solid #9F9F9F"}
                    borderRadius={"5px"}
                    placeholder="Search for a forum"
                    fontSize={"12px"}
                    value={searchQuery}
                    size={{ base: "sm" }}
                    onChange={handleSearchInputChange}
                  />
                  <InputRightElement>
                    <IconButton
                      backgroundColor={"white"}
                      icon={<FaSearch />}
                      color="#6899FE"
                      size={isMobile ? "0px" : "5px"}
                      mt={{ base: -2 }}
                      aria-label="Search"
                    />
                  </InputRightElement>
                </InputGroup>
                <Text
                  fontWeight={"bold"}
                  fontSize={"12.5px"}
                  mt={"15px"}
                  mb={"15px"}
                >
                  Trending Topics (PLACEHOLDERS FOR NOW)
                </Text>
                <HStack gap={"20px"} ml={"55px"}>
                  <Box
                    border={"1px solid white"}
                    mb={"15px"}
                    borderRadius={"10px"}
                    backgroundColor={"#F3F1F1"}
                    cursor={"pointer"}
                    boxShadow={"0px 4px 4px 0px #00000040"}
                  >
                    <Image
                      src={PlaceHolderOne}
                      alt="'placeholder 1"
                      height={"100px"}
                      width={"300px"}
                      border={"0px solid white"}
                      borderTopRadius={"10px"}
                    />
                    <Text m={"7.5px 5px"} fontWeight={"600"}>
                      Kendrick is Drake's dad?
                    </Text>
                  </Box>
                  <Box
                    border={"1px solid white"}
                    mb={"15px"}
                    borderRadius={"10px"}
                    backgroundColor={"#F3F1F1"}
                    cursor={"pointer"}
                    boxShadow={"0px 4px 4px 0px #00000040"}
                  >
                    <Image
                      src={PlaceHolderTwo}
                      alt="'placeholder 1"
                      height={"100px"}
                      width={"300px"}
                      border={"0px solid white"}
                      borderTopRadius={"10px"}
                    />
                    <Text m={"7.5px 5px"} fontWeight={"600"}>
                      Musicom REVOLUTIONIZES the Music Industry
                    </Text>
                  </Box>
                  <Box>
                    <Image
                      src={NextIndicator}
                      alt="next"
                      cursor={"pointer"}
                      _hover={{ transform: "translateY(1px)" }}
                      // have to add an onClick for this
                    ></Image>
                  </Box>
                </HStack>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="center"
                  gap={"12.5px"}
                >
                  <Button
                    color={"#6899FE"}
                    backgroundColor={"white"}
                    border={"1px solid #6899FE"}
                    size="sm"
                    _hover={{ transform: "translateY(1px)" }}
                    onClick={openCreateForumModal}
                  >
                    Create Forum
                  </Button>
                  <Button
                    backgroundColor={"#6899FE"}
                    color={"white"}
                    size="sm"
                    _hover={{ transform: "translateY(1px)" }}
                    onClick={openMyForumsModal}
                    marginLeft="2"
                  >
                    My Forums
                  </Button>
                </Box>
              </Box>
              <Modal
                isOpen={isCreateForumModalOpen}
                onClose={closeCreateForumModal}
              >
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Create Forum</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <FormControl>
                      <FormLabel>Forum Name</FormLabel>
                      <Input
                        type="text"
                        value={forumTitle}
                        onChange={(e) => setForumTitle(e.target.value)}
                        placeholder="Enter the forum name"
                      />
                    </FormControl>
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={createForum}>
                      Create
                    </Button>
                    <Button variant="ghost" onClick={closeCreateForumModal}>
                      Cancel
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </Flex>

            <Flex alignItems="center" p="4" justifyContent="space-between">
              <Modal isOpen={isMyForumsModalOpen} onClose={closeMyForumsModal}>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>My Forums</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    {/* Display user's owned forums */}
                    <Text fontWeight="bold">My Owned Forums:</Text>
                    {userForums.map((forum) => (
                      <Forum key={forum.id} {...forum} user={authUser.user} />
                    ))}

                    {/* Display user's joined forums */}
                    <Text fontWeight="bold" mt="4">
                      My Joined Forums:
                    </Text>
                    {userJoinedForums.map((forum) => (
                      <Forum key={forum.id} {...forum} user={authUser.user} />
                    ))}
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme="blue" onClick={closeMyForumsModal}>
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </Flex>
            <HStack mt={-5} ml={"30px"} mb={4}>
              <Menu>
                <MenuButton
                  as={Button}
                  aria-label="Options"
                  text={"Sort By"}
                  backgroundColor={"white"}
                  _hover={{
                    transform: "translateY(1px)",
                  }}
                  _active={{
                    background: SortIcon,
                  }}
                >
                  <HStack>
                    <Text
                      fontWeight={"400"}
                      fontSize={"12.5px"}
                      textDecor={"underline"}
                      _hover={{ color: "#706d63" }}
                      cursor={"pointer"}
                    >
                      Sort By:{" "}
                      {sortBy === "latest"
                        ? "Latest"
                        : sortBy === "highest-of-the-week"
                        ? "Highest of the Week"
                        : sortBy === "highest-of-the-month"
                        ? "Highest of the Month"
                        : sortBy === "highest-of-the-year"
                        ? "Highest of the Year"
                        : "Highest of All Time"}
                    </Text>

                    <Image src={SortIcon}></Image>
                  </HStack>
                </MenuButton>
                <MenuList
                  padding={0}
                  border={"0.5px solid black"}
                  borderTop={"0px"}
                  borderBottom={"0px"}
                >
                  <MenuItem
                    backgroundColor={"white"}
                    justifyContent={"center"}
                    padding={0}
                    border={"0.5px solid black"}
                    borderLeft={"0px"}
                    borderRight={"0px"}
                    borderTopRadius={"5px"}
                    fontWeight={"500"}
                    onClick={() => handleSortOptionChange("latest")}
                  >
                    Latest
                  </MenuItem>
                  <MenuItem
                    justifyContent={"center"}
                    border={"0.5px solid black"}
                    borderTop={"0px"}
                    borderLeft={"0px"}
                    borderRight={"0px"}
                    padding={0}
                    fontWeight={"500"}
                    onClick={() =>
                      handleSortOptionChange("highest-of-the-week")
                    }
                  >
                    Highest of the Week
                  </MenuItem>
                  <MenuItem
                    justifyContent={"center"}
                    border={"0.5px solid black"}
                    borderTop={"0px"}
                    borderLeft={"0px"}
                    borderRight={"0px"}
                    padding={0}
                    fontWeight={"500"}
                    onClick={() =>
                      handleSortOptionChange("highest-of-the-month")
                    }
                  >
                    Highest of the Month
                  </MenuItem>
                  <MenuItem
                    justifyContent={"center"}
                    border={"0.5px solid black"}
                    borderTop={"0px"}
                    borderLeft={"0px"}
                    borderRight={"0px"}
                    padding={0}
                    fontWeight={"500"}
                    onClick={() =>
                      handleSortOptionChange("highest-of-the-year")
                    }
                  >
                    Highest of the Year
                  </MenuItem>
                  <MenuItem
                    justifyContent={"center"}
                    border={"0.5px solid black"}
                    borderTop={"0px"}
                    borderBottomRadius={"5px"}
                    borderLeft={"0px"}
                    borderRight={"0px"}
                    padding={0}
                    fontWeight={"500"}
                    onClick={() =>
                      handleSortOptionChange("highest-of-all-time")
                    }
                  >
                    Highest of All Time
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
            <Stack spacing="4" mb={"16px"} minHeight={"239px"}>
              {isLoading ? (
                <VStack pb={"300px"}>
                  <Loading />
                </VStack>
              ) : (
                filterForums.map((post, index) => (
                  <Posts
                    key={index}
                    {...post}
                    totalVotes={forumVotes[post.forumId]}
                  />
                ))
              )}
            </Stack>
          </Container>
        </HStack>
      )}

      {isMobile && (
        <Container
          width={"100%"}
          backgroundColor={"white"}
          margin={0}
          padding={0}
          mt={"85px"}
          mx={0}
        >
          <Flex
            flexDirection={["column"]}
            justifyContent="space-between"
            alignItems={["center", "center", "flex-start"]}
            mb="0"
            p="3"
            mx={0}
          >
            <Box
              display="flex"
              flex={1}
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              mx={0}
            >
              <Text
                mb={6}
                fontWeight={"bold"}
                fontSize={"22px"}
                mt={-20}
                px={"10px"}
                color={"#6899FE"}
                backgroundColor={"#D9D9D9AB"}
              >
                Communities
              </Text>

              <InputGroup w={"90vw"} ml={"10px"}>
                <Input
                  border={"1px solid #9F9F9F"}
                  borderRadius={"5px"}
                  placeholder="Search for a forum"
                  fontSize={"12px"}
                  value={searchQuery}
                  size={{ base: "sm" }}
                  onChange={handleSearchInputChange}
                />
                <InputRightElement>
                  <IconButton
                    backgroundColor={"white"}
                    icon={<FaSearch />}
                    color="#6899FE"
                    size={isMobile ? "0px" : "5px"}
                    mt={{ base: -2 }}
                    aria-label="Search"
                  />
                </InputRightElement>
              </InputGroup>
              <Text
                fontWeight={"800"}
                fontSize={"12.5px"}
                mt={"15px"}
                mb={"15px"}
              >
                Trending Topics (PLACEHOLDERS FOR NOW)
              </Text>
              <HStack gap={"10px"} ml={"30px"}>
                <Box
                  border={"1px solid white"}
                  mb={"20px"}
                  borderRadius={"10px"}
                  backgroundColor={"#F3F1F1"}
                  cursor={"pointer"}
                  boxShadow={"0px 4px 4px 0px #00000040"}
                >
                  <Image
                    src={PlaceHolderOne}
                    alt="'placeholder 1"
                    height={"100px"}
                    width={"350px"}
                    border={"0px solid white"}
                    borderTopRadius={"10px"}
                  />
                  <Text m={"7.5px 5px"} fontWeight={"600"}>
                    Kendrick is Drake's dad?
                  </Text>
                </Box>
                <Box>
                  <Image
                    src={NextIndicator}
                    height={"20px"}
                    width={"20px"}
                    alt="next"
                    cursor={"pointer"}
                    _hover={{ transform: "translateY(1px)" }}
                    // have to add an onClick for this
                  ></Image>
                </Box>
              </HStack>
              <Box
                display="flex"
                flexDirection="row"
                justifyContent="center"
                gap={"6px"}
              >
                <Button
                  color={"#6899FE"}
                  backgroundColor={"white"}
                  border={"1px solid #6899FE"}
                  size="sm"
                  fontSize={"11px"}
                  fontWeight={"300"}
                  _hover={{ transform: "translateY(1px)" }}
                  onClick={openCreateForumModal}
                >
                  Create Forum
                </Button>
                <Button
                  backgroundColor={"#6899FE"}
                  color={"white"}
                  size="sm"
                  fontSize={"11px"}
                  fontWeight={"300"}
                  _hover={{ transform: "translateY(1px)" }}
                  onClick={openMyForumsModal}
                  marginLeft="2"
                >
                  My Forums
                </Button>
              </Box>
            </Box>

            <Divider
              orientation="horizontal"
              borderColor={"#9F9F9F"}
              borderWidth={"0.5px"}
              width={"90vw"}
              mt={"20px"}
              mb={"10px"}
            />

            <Modal
              isOpen={isCreateForumModalOpen}
              onClose={closeCreateForumModal}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Create Forum</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <FormControl>
                    <FormLabel>Forum Name</FormLabel>
                    <Input
                      type="text"
                      value={forumTitle}
                      onChange={(e) => setForumTitle(e.target.value)}
                      placeholder="Enter the forum name"
                    />
                  </FormControl>
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={createForum}>
                    Create
                  </Button>
                  <Button variant="ghost" onClick={closeCreateForumModal}>
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Flex>

          <Modal isOpen={isMyForumsModalOpen} onClose={closeMyForumsModal}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>My Forums</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {/* Display user's owned forums */}
                <Text fontWeight="bold">My Owned Forums:</Text>
                {userForums.map((forum) => (
                  <Forum key={forum.id} {...forum} user={authUser.user} />
                ))}

                {/* Display user's joined forums */}
                <Text fontWeight="bold" mt="4">
                  My Joined Forums:
                </Text>
                {userJoinedForums.map((forum) => (
                  <Forum key={forum.id} {...forum} user={authUser.user} />
                ))}
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" onClick={closeMyForumsModal}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <VStack mt={"-15px"} mb={4} alignItems={"flex-start"}>
            <Menu>
              <MenuButton
                as={Button}
                aria-label="Options"
                text={"Sort By"}
                backgroundColor={"white"}
                _hover={{
                  transform: "translateY(1px)",
                }}
                _active={{
                  background: SortIcon,
                }}
              >
                <HStack>
                  <Text
                    fontWeight={"400"}
                    fontSize={"12.5px"}
                    textDecor={"underline"}
                    _hover={{ color: "#706d63" }}
                    cursor={"pointer"}
                  >
                    Sort By:{" "}
                    {sortBy === "latest"
                      ? "Latest"
                      : sortBy === "highest-of-the-week"
                      ? "Highest of the Week"
                      : sortBy === "highest-of-the-month"
                      ? "Highest of the Month"
                      : sortBy === "highest-of-the-year"
                      ? "Highest of the Year"
                      : "Highest of All Time"}
                  </Text>

                  <Image src={SortIcon}></Image>
                </HStack>
              </MenuButton>
              <MenuList
                padding={0}
                border={"0.5px solid black"}
                borderTop={"0px"}
                borderBottom={"0px"}
              >
                <MenuItem
                  backgroundColor={"white"}
                  justifyContent={"center"}
                  padding={0}
                  border={"0.5px solid black"}
                  borderLeft={"0px"}
                  borderRight={"0px"}
                  borderTopRadius={"5px"}
                  fontWeight={"500"}
                  onClick={() => handleSortOptionChange("latest")}
                >
                  Latest
                </MenuItem>
                <MenuItem
                  justifyContent={"center"}
                  border={"0.5px solid black"}
                  borderTop={"0px"}
                  borderLeft={"0px"}
                  borderRight={"0px"}
                  padding={0}
                  fontWeight={"500"}
                  onClick={() => handleSortOptionChange("highest-of-the-week")}
                >
                  Highest of the Week
                </MenuItem>
                <MenuItem
                  justifyContent={"center"}
                  border={"0.5px solid black"}
                  borderTop={"0px"}
                  borderLeft={"0px"}
                  borderRight={"0px"}
                  padding={0}
                  fontWeight={"500"}
                  onClick={() => handleSortOptionChange("highest-of-the-month")}
                >
                  Highest of the Month
                </MenuItem>
                <MenuItem
                  justifyContent={"center"}
                  border={"0.5px solid black"}
                  borderTop={"0px"}
                  borderLeft={"0px"}
                  borderRight={"0px"}
                  padding={0}
                  fontWeight={"500"}
                  onClick={() => handleSortOptionChange("highest-of-the-year")}
                >
                  Highest of the Year
                </MenuItem>
                <MenuItem
                  justifyContent={"center"}
                  border={"0.5px solid black"}
                  borderTop={"0px"}
                  borderBottomRadius={"5px"}
                  borderLeft={"0px"}
                  borderRight={"0px"}
                  padding={0}
                  fontWeight={"500"}
                  onClick={() => handleSortOptionChange("highest-of-all-time")}
                >
                  Highest of All Time
                </MenuItem>
              </MenuList>
            </Menu>
          </VStack>
          <Stack spacing="4" mb={"16px"} minHeight={"239px"}>
            {isLoading ? (
              <VStack pb={"300px"}>
                <Loading />
              </VStack>
            ) : (
              filterForums.map((post, index) => (
                <Posts
                  key={index}
                  {...post}
                  totalVotes={forumVotes[post.forumId]}
                />
              ))
            )}
          </Stack>
        </Container>
      )}
    </>
  );
}

export default ForumPage;
