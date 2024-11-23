import React, { useEffect, useState } from "react";
import {
  IconButton,
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  Text,
  useDisclosure,
  Image,
  HStack,
  Menu,
  MenuButton,
  Avatar,
  MenuItem,
  MenuList,
  MenuDivider,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useBreakpointValue,
  Spacer,
  Badge,
  useColorMode,
  Textarea,
  VStack,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import Avatarr from "components/profile/Avatar";
import {
  FiHome,
  FiStar,
  FiSettings,
  FiBell,
  FiUsers,
  FiAward,
  FiChevronRight,
  FiChevronLeft,
  FiMessageCircle,
  FiX,
  FiMoon,
  FiSun,
  FiSearch,
  FiMap,
  FiPlus,
  FiSend,
  FiCamera,
  FiVideo,
  FiFile,
} from "react-icons/fi";
import { LuFileInput } from "react-icons/lu";
import { GoHome } from "react-icons/go";
import { LuMessagesSquare } from "react-icons/lu";
import { MdOutlineCreditScore } from "react-icons/md";
import { BsMusicNote, BsSearch } from "react-icons/bs";
import playVideo from "./play.png";
import { RiSecurePaymentFill } from "react-icons/ri";
import logo from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Text Logo copy@0.75x.png";
import logoM from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png";
import filePdf from "./pdf-icon.png";
import fileImage from "./image-icon.png";
import fileAudio from "./play.png";
import { useAuth, useLogout } from "hooks/auth";
import { SearchIcon } from "@chakra-ui/icons";
import {
  DASHBOARD,
  FINDR,
  MESSAGEMU,
  NETWORK,
  PAYMU,
  PROTECTED,
  SEARCH,
  FORUM,
  USER,
  FORUMS,
  BILLING,
  ADMIN,
  SETTINGS,
  INSTUDIO,
} from "lib/routes";
import { Link as goToLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  startAt,
  endAt,
} from "firebase/firestore";
import { db } from "lib/firebase";
import { formatDistanceToNow } from "date-fns";
import NotificationItem from "./NotificationItem";
import { orderBy } from "lodash";
import { BiGroup } from "react-icons/bi";
import { BsCash, BsFileMusic } from "react-icons/bs";
import { FaForumbee, FaReact } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { useAddPost } from "hooks/posts";
import { getAnalytics, logEvent } from "firebase/analytics";
import reactTextareaAutosize from "react-textarea-autosize";
import UsernameButton from "components/profile/UsernameButton";
import { CgLivePhoto } from "react-icons/cg";

export default function Navbar() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showText, setShowText] = useState(false);

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <>
      <SidebarContent
        onClose={onClose}
        showText={showText}
        setShowText={setShowText}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      ></Drawer>
      <MobileNav
        onOpen={onOpen}
        showText={showText}
        setShowText={setShowText}
        colorMode={colorMode}
        toggleColorMode={toggleColorMode}
      />
    </>
  );
}

function NewPost({ isOpen, onCloseNewPost }) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { register, handleSubmit, reset } = useForm();
  const { user, isLoading: authLoading } = useAuth();
  const { addPost, isLoading: addingPost } = useAddPost();

  const [selectedFiles, setSelectedFiles] = useState([]);
  function handleAddPost(data) {
    addPost({
      uid: user.id,
      text: text,
      photos: selectedPhotos,
      videos: selectedVideos,
      files: selectedFiles,
    });
    reset();
    setSelectedFiles([]);
    setSelectedPhotos([]);
    setSelectedVideos([]);
    setText("");
    onCloseNewPost();
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [filePressed, setFilePressed] = useState(false);
  const [text, setText] = useState("");

  const handleInputChange = (event) => {
    const { value } = event.target;
    setIsExpanded(value !== "");
    if (value == "") setText("");
    else setText(value);
  };

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);

  const handlePhotoInputChange = (event) => {
    const photos = Array.from(event.target.files);
    setSelectedPhotos((prevPhotos) => [...prevPhotos, ...photos]);
  };

  const handleVideoInputChange = (event) => {
    const videos = Array.from(event.target.files);
    setSelectedVideos((prevVideos) => [...prevVideos, ...videos]);
  };

  const handleFileDelete = (file) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((prevFile) => prevFile.name !== file.name)
    );
  };

  const handlePhotoDelete = (photo) => {
    setSelectedPhotos((prevPhotos) =>
      prevPhotos.filter((prevPhoto) => prevPhoto.name !== photo.name)
    );
  };

  const handleVideoDelete = (video) => {
    setSelectedVideos((prevVideos) =>
      prevVideos.filter((prevVideo) => prevVideo.name !== video.name)
    );
  };

  const analytics = getAnalytics();

  useEffect(() => {
    logEvent(analytics, "new post");
  }, []);
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Modal isOpen={isOpen} onClose={onCloseNewPost} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          mt={isMobile ? 1.5 : 3.5}
          p={isMobile ? "5px" : "12px 18px"}
          ml={isMobile ? "15px" : ""}
        >
          Create a New Post
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(handleAddPost)}>
          <ModalBody>
            <Box maxW="auto" mx="auto" pt="0">
              <Box
                maxW="auto"
                mx={{ base: "auto", md: "auto" }}
                p={2}
                pb="0"
                rounded="md"
                bg={colorMode === "light" ? "white" : "gray.900"}
                border={"0.1px solid #e2e8f0"}
              >
                <VStack align="start" ml="3" mt={1}>
                  <HStack>
                    <Avatarr size="sm" user={user} post={true} mr="10" />
                    <Text color={"#9f9f9f"}>{user?.username}</Text>
                  </HStack>
                </VStack>
                <HStack spacing={2} align="start" ml="2.5" mr="2.5">
                  <Textarea
                    as={reactTextareaAutosize}
                    resize="none"
                    mt="3"
                    height={100}
                    fontSize={14}
                    placeholder="Share your notes ♪"
                    minRows={{ base: 1, md: 3 }}
                    {...register("text")}
                    onChange={handleInputChange}
                  />
                </HStack>

                <Flex
                  mt={2}
                  mb={0}
                  pb={0}
                  align="center"
                  justify="space-between"
                  ml="1"
                >
                  <Box rounded="md" p={0}>
                    <HStack>
                      <label htmlFor="file-input">
                        <IconButton
                          as="span"
                          background="none"
                          _hover={{ background: "gray.200" }}
                          icon={<LuFileInput size={18} color="#6899FE" />}
                        />
                        <input
                          id="file-input"
                          type="file"
                          style={{ display: "none" }}
                          multiple
                          accept="*"
                          onChange={handleFileInputChange}
                        />
                      </label>
                    </HStack>
                  </Box>
                  {text !== "" ||
                  selectedPhotos.length > 0 ||
                  selectedVideos.length > 0 ||
                  selectedFiles.length > 0 ? (
                    <IconButton
                      mr={2}
                      bg="#fff"
                      rounded="md"
                      size="sm"
                      type="submit"
                      icon={<FiSend fontSize={"18px"} color="#6899FE" />}
                      fontWeight="bold"
                      isLoading={authLoading || addingPost}
                      loadingText="Loading..."
                    />
                  ) : (
                    <IconButton
                      mr={2}
                      bg="#fff"
                      rounded="md"
                      size="sm"
                      type="submit"
                      icon={<FiSend fontSize={"18px"} color="#6899FE" />}
                      fontWeight="bold"
                      isDisabled={true}
                      loadingText="Loading..."
                    />
                  )}
                </Flex>
              </Box>
            </Box>
          </ModalBody>
        </form>
        <VStack align="start" spacing={1} mt={0} ml="15px" mb="10px">
          {selectedFiles.length > 0 && (
            <Flex wrap="wrap" align="center">
              {selectedFiles.map((file) => (
                <HStack gap={0}>
                  <div
                    key={file.name}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      padding: "5px",
                      marginTop: "15px",
                      marginBottom: "15px",
                      marginRight: "0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        style={{
                          height: "60px",
                          width: "60px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                      />
                    ) : file.type.startsWith("video/") ? (
                      <div
                        style={{
                          position: "relative",
                          height: "60px",
                          width: "60px",
                        }}
                      >
                        <video
                          src={URL.createObjectURL(file)}
                          style={{
                            height: "100%",
                            width: "100%",
                            borderRadius: "6px",
                            objectFit: "cover",
                          }}
                        />
                        <img
                          src={playVideo}
                          style={{
                            position: "absolute",
                            height: "24px",
                            width: "24px",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                    ) : file.type.startsWith("audio/") ? (
                      <audio
                        src={URL.createObjectURL(file)}
                        controls
                        style={{
                          transform: "scale(0.75)",
                          position: "relative",
                          left: "-44px",
                        }}
                      />
                    ) : (
                      <img
                        src={filePdf}
                        style={{
                          height: "40px",
                          width: "40px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                      />
                    )}

                    {file.type.startsWith("application/pdf") && (
                      <Text m="1">{file.name}</Text>
                    )}
                  </div>
                  <IconButton
                    key={`delete-${file.name}`}
                    marginBottom={55}
                    marginRight={2.5}
                    as="span"
                    background="none"
                    minWidth={0}
                    marginLeft={1}
                    _hover={{ background: "gray.200" }}
                    icon={<FiX size={10} />}
                    onClick={() => handleFileDelete(file)}
                  />
                </HStack>
              ))}
            </Flex>
          )}
        </VStack>
      </ModalContent>
    </Modal>
  );
}

function SidebarContent({ onClose, showText, setShowText, ...rest }) {
  // Receive the showText and setShowText props
  const [iconWidth, setIconWidth] = useState(0);
  const sidebarRef = React.useRef(null);
  const location = useLocation();
  const {
    isOpen: isOpenNewPost,
    onOpen,
    onClose: onCloseNewPost,
  } = useDisclosure();

  const handleToggleForm = () => {
    if (isOpenNewPost) {
      onCloseNewPost(); // Close the modal
    } else {
      onOpen(); // Open the modal
    }
  };

  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    localStorage.setItem("colorMode", colorMode);
  }, [colorMode]);

  useEffect(() => {
    if (sidebarRef.current) {
      const icons = sidebarRef.current.querySelectorAll(".sidebar-icon");
      if (icons.length > 0) {
        const firstIconWidth = icons[0].getBoundingClientRect().width;
        setIconWidth(firstIconWidth);
      }
    }
  }, []);

  const toggleText = () => {
    setShowText(!showText); // Toggle the showText state using setShowText function
  };

  const sidebarItems = [
    { name: "Home", icon: GoHome, active: false, goTo: DASHBOARD },
    { name: "Network", icon: FiUsers, active: false, goTo: NETWORK },
    { name: "Findr", icon: FiMap, active: false, goTo: FINDR },
    { name: "Forums", icon: LuMessagesSquare, active: false, goTo: FORUM },
    { name: "PayMu", icon: MdOutlineCreditScore, active: false, goTo: PAYMU },
    { name: "InStudio", icon: CgLivePhoto, active: false, goTo: INSTUDIO },
    { name: "New Post", icon: BsMusicNote, active: false },
    // { name: "NFT", icon: FaReact, active: false, goTo: "" },
    // { name: "Platinum", icon: FiAward, active: false, goTo: "" },
  ];

  return (
    <Box
      ref={sidebarRef}
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w="auto"
      pos="fixed"
      h="full"
      {...rest}
      zIndex={999}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      <Box textAlign="center" mt="auto" mb="10">
        <Link
          fontSize="sm"
          fontWeight="bold"
          color={useColorModeValue("gray.600", "gray.400")}
          onClick={toggleText}
          style={{ textDecoration: "none" }}
          _focus={{ boxShadow: "none" }}
        >
          {showText ? (
            <IconButton
              icon={<FiChevronLeft />}
              mt="2"
              color={colorMode === "light" ? "#6899fe" : "white"}
              background="none"
              fontSize="20"
            />
          ) : (
            <IconButton
              icon={<FiChevronRight />}
              mt="2"
              color={colorMode === "light" ? "#6899fe" : "white"}
              background="none"
              fontSize="20"
            />
          )}
        </Link>
      </Box>
      {sidebarItems.map((item) =>
        item.name === "New Post" ? (
          <Button
            onClick={handleToggleForm}
            ml={showText ? 5 : 5}
            w={{ md: !showText && 5 }}
            mt={4}
            leftIcon={<BsMusicNote />}
            iconSpacing={showText ? 2 : 0}
            backgroundColor={"#6899fe"}
            textColor={"white"}
            // _hover={{ backgroundColor: "#1041B2" }}
          >
            {showText && "New Post"}
          </Button>
        ) : (
          <NavItem
            key={item.name}
            icon={item.icon}
            as={goToLink}
            to={item.goTo}
            showText={showText}
            active={location.pathname === item.goTo} // Sets the item as active if the current location matches the goTo attribute
            colorMode={colorMode}
            toggleColorMode={toggleColorMode}
          >
            {item.name}
          </NavItem>
        )
      )}
      {isOpenNewPost && (
        <NewPost isOpen={isOpenNewPost} onCloseNewPost={onCloseNewPost} />
      )}
    </Box>
  );
}

function NavItem({
  icon,
  children,
  showText,
  active,
  colorMode,
  toggleColorMode,
  ...rest
}) {
  return (
    <Link
      href="#"
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow: "none" }}
    >
      <Flex
        align="center"
        p="4"
        py={6}
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        // _hover={{
        //   bg: "blue.500",
        //   color: "white",
        // }}
        // bg={active ? (colorMode === "light" ? "gray.200" : "gray.600") : "none"}
        color={colorMode === "light" ? "gray" : "white"}
        {...rest}
      >
        <Icon
          mr={showText ? "4" : "0"}
          fontSize={icon === FiMap ? "19" : "21"} // Increase the size of the icons
          color={"#6899fe"}
          as={icon}
        />
        {showText && (
          <Text
            fontSize="md"
            fontWeight="medium"
            color={colorMode === "light" ? "#6899fe" : "white"}
          >
            {children}
          </Text>
        )}
      </Flex>
    </Link>
  );
}

function MobileNav({ onOpen, showText, setShowText }) {
  const { logout, isLoading } = useLogout();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();

  const {
    isOpen: isOpenNewPost,
    onOpen: onOpenNewPost,
    onClose: onCloseNewPost,
  } = useDisclosure();

  const handleToggleForm = () => {
    if (isOpenNewPost) {
      onCloseNewPost(); // Close the modal
    } else {
      onOpenNewPost(); // Open the modal
    }
  };

  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    localStorage.setItem("colorMode", colorMode);
  }, [colorMode]);

  useEffect(() => {
    if (user && user.id) {
      const q = query(
        collection(db, "notifications"),
        where("uid", "==", user.id)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let notifications = [];
        querySnapshot.forEach((doc) => {
          notifications.push(doc.data());
        });
        setNotifications(notifications);
      });

      return () => unsubscribe();
    }
  }, [user]);

  async function deleteNotification(
    notificationId,
    userFollowedId,
    notificationType,
    notificationTime
  ) {
    try {
      const notificationSnapshot = await getDocs(
        query(
          collection(db, "notifications"),
          where("uid", "==", notificationId),
          where("from", "==", userFollowedId),
          where("type", "==", notificationType),
          where("time", "==", notificationTime)
        )
      );

      if (!notificationSnapshot.empty) {
        notificationSnapshot.docs.forEach((docSnapshot) => {
          deleteDoc(doc(db, "notifications", docSnapshot.id));
        });
        console.log("Notification deleted successfully.");
      } else {
        console.log("Notification not found or does not match criteria.");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userResults, setUserResults] = useState([]);

  const fetchUsers = async (searchQuery) => {
    const search = searchQuery.toLowerCase();
    try {
      const q = query(
        collection(db, "users"),
        where("username", ">=", search),
        where("username", "<=", search + "\uf8ff")
      );
      const businessQ = query(
        collection(db, "businesses"),
        where("username", ">=", search),
        where("username", "<=", search + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const businessQuerySnapshot = await getDocs(businessQ);
      const users = [
        ...querySnapshot.docs.map((doc) => doc.data()),
        ...businessQuerySnapshot.docs.map((doc) => doc.data()),
      ];
      setUserResults(users);
      setSearchResults(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchQuery(inputValue);
    if (inputValue) {
      fetchUsers(inputValue);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (result, index) => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResultIndex(index);
    window.location.href = `${PROTECTED}/profile/${result.username}`;
  };

  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      if (selectedResultIndex !== -1 && searchResults.length > 0) {
        const username = searchResults[selectedResultIndex];
        setSearchQuery("");
        setSearchResults([]);
        setSelectedResultIndex(-1);
        window.location.href = `${PROTECTED}/profile/${username.username}`;
      } else {
        const username = searchQuery.trim();
        window.location.href = `${PROTECTED}/profile/${username}`;
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedResultIndex((prevIndex) => {
        if (prevIndex === -1) {
          return searchResults.length - 1;
        } else {
          return Math.max(prevIndex - 1, -1);
        }
      });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedResultIndex((prevIndex) => {
        if (prevIndex === searchResults.length - 1) {
          return -1;
        } else {
          return Math.min(prevIndex + 1, searchResults.length - 1);
        }
      });
    }
  };

  const [subscribed, setSubscribed] = useState(null);

  const getActiveSubscription = async (user) => {
    try {
      if (!user) {
        console.log("User is undefined.");
        return null;
      }

      const userDocRef = collection(
        db,
        user.businessName ? "businesses" : "users",
        user.id,
        "subscriptions"
      );

      const snapshot = await getDocs(
        query(userDocRef, where("status", "in", ["trialing", "active"]))
      );

      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return data.status;
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

  return (
    <Flex
      ml={{ base: !isMobile && -9, md: !isMobile && -9, sm: !isMobile && "-5px" }}  
      px={{ base: !isMobile && 0, md: !isMobile && 0 }}
      height={{ base: 16, md: 16 }}
      alignItems="center"
      direction={isMobile ? "column" : undefined}
      bg={colorMode === "light" ? "white" : "gray.900"}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "space-between" }}
      position="fixed"
      right={0}
      left={0}
      zIndex={999} // Add zIndex to ensure the navbar is displayed above other elements
    >
      {!isMobile && (
        <Link as={goToLink} to={DASHBOARD}>
          <Image
            src={logo}
            alt="Musicom Logo"
            display={{ base: "flex" }}
            h={{ base: "20", md: "20" }}
            align="center"
            ml={{ base: "auto", md: 0 }} // Set the ml to 20 if showText is true            
          />
        </Link>
      )}
      {isMobile && (
        <HStack
        w="100%"
        px={{ base: 1, md: 4 }}
        py={0.5}
        justifyContent="space-between"
        alignItems="center"
        spacing={"0.5%"}
      >
          <Link as={goToLink} to={DASHBOARD}>
            <Image
              src={logoM}
              alt="Musicom Logo"
              height="70px"
              width="auto"
              maxW="100%"
            />
          </Link>
          <Button
            backgroundColor="#6899fe"
            color="white"
            onClick={handleToggleForm}
            height="20px"  // Adjust height to increase button size
            minWidth="10px"   // Adjust width to increase button size
            p="7px"
            mr="10px"
          >
            <Icon as={BsMusicNote} boxSize={2.5}/>
          </Button>
          {isOpenNewPost && (
            <NewPost isOpen={isOpenNewPost} onCloseNewPost={onCloseNewPost} />
          )}
  
  
        <InputGroup w={{ base: "50%", md: "auto" }} maxW="100%">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            h="20px"
            _placeholder={{color: "#C4C9CF", fontSize: '10px'}}
          />
          <InputRightElement h="20px" pointerEvents="none">
            <SearchIcon color="blue.300" boxSize="60%"/>
          </InputRightElement>
        </InputGroup>
  
        <Menu>
          <MenuButton position="relative">
            <IconButton
              
              fontSize="18px"
              variant="ghost"
              aria-label="Notifications"
              color="#6899fe"
              icon={<FiBell />}
            />
            {notifications.length > 0 && (
              <Badge
                bg="#E21919"
                color="white"
                borderRadius="full"
                position="absolute"
                top="2px"
                right="6px"
                fontSize="9px"
              >
                {notifications.length}
              </Badge>
            )}
          </MenuButton>
          <MenuList bg={colorMode === "light" ? "white" : "gray.900"}>
            {notifications.length > 0 ? (
              notifications
                .slice(0, 4)
                .sort((a, b) => b.time - a.time)
                .map((notification) => (
                  <NotificationItem
                    key={notification.uid}
                    notification={notification}
                    deleteNotification={deleteNotification}
                    colorMode={colorMode}
                  />
                ))
            ) : (
              <MenuItem bg={colorMode === "light" ? "white" : "gray.900"}>
                No notifications
              </MenuItem>
            )}
            {notifications.length > 4 && (
              <Text align="center" fontSize="sm" color="gray.500">
                ...
              </Text>
            )}
          </MenuList>
        </Menu>
  
        <Menu>
          <MenuButton
            size="md"
            variant="ghost"
            aria-label="Profile"
            _hover={{ color: "blue.500" }}
          >
            <Avatar
              size={isMobile ? "sm" : "md"}
              mr={5}
              src={user?.avatar !== "" ? user?.avatar : logoM}
              ring="1px"
              ringColor="#6899fe"
            />
          </MenuButton>
          <MenuList bg={colorMode === "light" ? "white" : "gray.900"}>
            <MenuItem
              bg={colorMode === "light" ? "white" : "gray.900"}
              as={goToLink}
              to={`${PROTECTED}/profile/${user?.username}`}
            >
              Profile
            </MenuItem>
            <MenuItem
              bg={colorMode === "light" ? "white" : "gray.900"}
              as={goToLink}
              to={SETTINGS}
            >
              Settings
            </MenuItem>
            <MenuItem
              bg={colorMode === "light" ? "white" : "gray.900"}
              as={goToLink}
              to={BILLING}
            >
              {subscribed ? "Billing" : "Upgrade to Premium"}
            </MenuItem>
            {user?.isAdmin && (
              <MenuItem
                bg={colorMode === "light" ? "white" : "gray.900"}
                as={goToLink}
                to={ADMIN}
              >
                Admin Panel
              </MenuItem>
            )}
            <MenuItem
              bg={colorMode === "light" ? "white" : "gray.900"}
              onClick={toggleColorMode}
            >
              <IconButton
                icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
                onClick={toggleColorMode}
                aria-label="Toggle Color Mode"
              />
              <Text ml="2">{colorMode === "light" ? "Dark Mode" : "Light Mode"}</Text>
            </MenuItem>
            <MenuDivider />
            <MenuItem
              bg={colorMode === "light" ? "white" : "gray.900"}
              onClick={logout}
            >
              Sign out
            </MenuItem>
          </MenuList>
        </Menu>
        </HStack>
      )}
      {!isMobile && (
        <Box mr="auto" ml="auto" display={{ base: "none", md: "flex" }}>
          <InputGroup>
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              h={{ base: "auto", md: "10" }}
              w="605px"
            />
            <InputRightElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputRightElement>
          </InputGroup>
          {searchResults.length > 0 && (
            <Box
              position="absolute"
              mt={14}
              p={2}
              borderRadius="md"
              boxShadow="md"
              backgroundColor={colorMode === "light" ? "white" : "gray.900"}
              color={colorMode === "light" ? "black" : "white"}
              zIndex={1}
              width="605px"
            >
              {searchResults.map((result, index) => (
                <Box
                  key={result.id}
                  onClick={() => handleSearchResultClick(result, index)}
                  cursor="pointer"
                  padding="0.5rem"
                  bg={
                    selectedResultIndex === index
                      ? colorMode === "light"
                        ? "gray.200"
                        : "gray.800"
                      : "transparent"
                  }
                  _hover={{
                    background: colorMode === "light" ? "gray.200" : "gray.800",
                  }}
                  display="flex"
                  alignItems="center"
                >
                  <Avatar
                    size="sm"
                    src={result.avatar !== "" ? result.avatar : logoM}
                  />
                  <Text ml="2">{result.username}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      {!isMobile && (
        <HStack spacing={{ base: "0", md: "3" }}>
          <Link as={goToLink} to={MESSAGEMU}>
            <IconButton
              ml={"5"}
              size="md"
              fontSize="2xl"
              color={"#6899fe"}
              variant="ghost"
              aria-label="Messages"
              icon={<FiMessageCircle />}
            />
          </Link>
          <Menu defaultIsOpen={false} autoSelect={false}>
            <MenuButton py={2} transition="all 0.3s" pr="0">
              <Box position="relative">
                <IconButton
                  size="md"
                  fontSize="2xl"
                  variant="ghost"
                  color={"#6899fe"}
                  aria-label="Notifications"
                  icon={<FiBell />}
                />
                {notifications.length > 0 && (
                  
                  <Badge
                  bg="#E21919"
                  color="white"
                  borderRadius="full"
                  position="absolute"
                  top="2px"
                  right="6px"
                  fontSize="10px"
                >
                  {notifications.length}
                </Badge>
                )}
              </Box>
            </MenuButton>
            <MenuList
              bg={colorMode === "light" ? "white" : "gray.900"}
              borderColor="gray.200"
            >
              {notifications.length > 0 ? (
                <>
                  {notifications
                    .slice(0, 4)
                    .sort((a, b) => b.time - a.time) // Sort the notifications in descending order of date
                    .map((notification, index) => (
                      <NotificationItem
                        key={notification.uid}
                        notification={notification}
                        deleteNotification={deleteNotification}
                        colorMode={colorMode}
                      />
                    ))}

                  {notifications.length > 4 && (
                    <Text align="center" fontSize="sm" color="gray.500">
                      ...
                    </Text>
                  )}
                </>
              ) : (
                <MenuItem bg={colorMode === "light" ? "white" : "gray.900"}>
                  No notifications
                </MenuItem>
              )}
            </MenuList>
          </Menu>
          <Flex alignItems="center">
            <Menu defaultIsOpen={false} autoSelect={false}>
              <MenuButton
                py={2}
                transition="all 0.3s"
                _focus={{ boxShadow: "none" }}
                pr="5"
              >
                <HStack>
                  <Avatar
                    size="sm"
                    src={user?.avatar !== "" ? user?.avatar : logoM}
                  />
                </HStack>
              </MenuButton>
              <MenuList
                bg={colorMode === "light" ? "white" : "gray.900"}
                borderColor="gray.200"
              >
                <MenuItem
                  bg={colorMode === "light" ? "white" : "gray.900"}
                  as={goToLink}
                  to={`${PROTECTED}/profile/${user?.username}`}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  bg={colorMode === "light" ? "white" : "gray.900"}
                  as={goToLink}
                  to={`${SETTINGS}`}
                >
                  Settings
                </MenuItem>
                <MenuItem
                  bg={colorMode === "light" ? "white" : "gray.900"}
                  as={goToLink}
                  to={`${BILLING}`}
                >
                  {subscribed ? "Billing" : "Upgrade to Premium"}
                </MenuItem>
                {user?.isAdmin && (
                  <MenuItem
                    bg={colorMode === "light" ? "white" : "gray.900"}
                    as={goToLink}
                    to={`${ADMIN}`}
                  >
                    Admin Panel
                  </MenuItem>
                )}
                <MenuItem
                  bg={colorMode === "light" ? "white" : "gray.900"}
                  onClick={toggleColorMode}
                >
                  <IconButton
                    icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
                    onClick={toggleColorMode}
                    aria-label="Toggle Color Mode"
                  />
                  {colorMode !== "light" ? (
                    <Text ml="2">light mode</Text>
                  ) : (
                    <Text ml="2">dark mode</Text>
                  )}
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  bg={colorMode === "light" ? "white" : "gray.900"}
                  onClick={logout}
                >
                  Sign out
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </HStack>
      )}
    </Flex>
  );
}

export function FooterIcons() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { logout, isLoading } = useLogout();
  const { user } = useAuth();

  const mobileSidebarItems = [
    { name: "Home", icon: GoHome, active: false, goTo: DASHBOARD },
    { name: "Network", icon: FiUsers, active: false, goTo: NETWORK },
    { name: "Message", icon: FiMessageCircle, active: false, goTo: MESSAGEMU },
    { name: "Findr", icon: FiMap, active: false, goTo: FINDR },
    { name: "Forums", icon: LuMessagesSquare, active: false, goTo: FORUM },
    { name: "PayMu", icon: MdOutlineCreditScore, active: false, goTo: PAYMU },
    { name: "InStudio", icon: CgLivePhoto, active: false, goTo: INSTUDIO },
  ];

  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    localStorage.setItem("colorMode", colorMode);
    return; // Save the color mode to local storage
  }, [colorMode]);

  return (
    <Flex
      justify={isMobile ? "center" : "flex-end"}
      py={4}
      bg={useColorModeValue("white", "gray.900")}
      position="fixed"
      bottom="0"
      left="0"
      width="100%"
      zIndex="10"
      display={isMobile ? "flex" : "none"}
      flexDirection="column"
    >
      <Box borderTopWidth="1px" borderTopColor="gray.200" />
      <Flex justify="space-evenly" py={1}>
        {mobileSidebarItems.map((items) =>
          items.name === "Message" ? (
            <Link as={goToLink} to={MESSAGEMU}>
              <IconButton
                key={items.name}
                size="sm"
                variant="ghost"
                aria-label={items.name}
                icon={<items.icon size={"24"} />}
                color={
                  location.pathname === items.goTo ? "blue.500" : "gray.400"
                }
                _hover={{ color: "blue.500" }}
                padding-top="40px"
              />
            </Link>
          ) : (
            <IconButton
              key={items.name}
              size="sm"
              variant="ghost"
              aria-label={items.name}
              as={goToLink}
              to={items.goTo}
              icon={<items.icon size={"24"} />}
              color={location.pathname === items.goTo ? "blue.500" : "gray.400"}
              _hover={{ color: "blue.500" }}
              padding-top="40px"
            />
          )
        )}
      </Flex>
    </Flex>
  );
}
