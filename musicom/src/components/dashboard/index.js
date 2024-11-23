import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  useBreakpointValue,
  Flex,
  IconButton,
  HStack,
  Button,
  Textarea,
  VStack,
  Text,
  Divider,
  useColorMode,
  useDisclosure,
  Center,
  Spinner,
} from "@chakra-ui/react";
import reactTextareaAutosize from "react-textarea-autosize";
import { LuFileInput } from "react-icons/lu";
import filePdf from "../navbar/pdf-icon.png";
import playVideo from "../navbar/play.png";
import Avatar from "components/profile/Avatar";
import { useForm } from "react-hook-form";
import { FiCamera, FiFile, FiPlus, FiSend, FiVideo, FiX } from "react-icons/fi";
import { useAuth } from "hooks/auth";
import { useAddPost, usePosts, usePostsAlgorithm } from "hooks/posts";
import PostsList from "components/post/PostsList";
import { getAnalytics, logEvent } from "firebase/analytics";
import { BsMusicNote } from "react-icons/bs";

function NewPost() {
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
    <Box maxW="560px" mx="auto" pt="0" pb="10">
      <Box
        maxW={isMobile ? "400px" : "auto"}
        // maxW="auto"
        mx={{ base: "auto", md: "auto" }}
        boxShadow="0px 3px 6px -1px #6899FE"
        rounded="md"
        bg={colorMode === "light" ? "white" : "gray.900"}
        border={colorMode === "light" ? "" : "2px solid"}
        borderColor={colorMode === "light" ? "" : "gray.200"}
      >
        <form onSubmit={handleSubmit(handleAddPost)}>
          <Box
            maxW={isMobile ? "400px" : "auto"}
            // maxW="auto"
            mx={{ base: "auto", md: "auto" }}
            p={2}
            pb="0"
            rounded="md"
            bg={colorMode === "light" ? "white" : "gray.900"}
            border={"0.1px solid #e2e8f0"}
          >
            <VStack align="start">
              <HStack align="start" marginLeft={"10px"} mt={"5px"}>
                <Avatar size="sm" user={user} post={true} color="#6899FE" />
                <Text color={"#9f9f9f"} mt={"1px"}>
                  {user?.username}{" "}
                </Text>
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
                      cursor="pointer"
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
      </Box>
    </Box>
  );
}

export default function Dashboard() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, isLoading: authLoading } = useAuth();
  const { posts, isLoading, loadMorePosts, hasMorePosts } = usePostsAlgorithm();
  const loadMoreRef = useRef();
  const analytics = getAnalytics();

  useEffect(() => {
    logEvent(analytics, "Home Page");
  }, []);
  const handleToggleForm = () => {
    isOpen ? onClose() : onOpen();
  };

  // Setting up the intersection observer to trigger the loading of more posts when user scrolls to the bottom of the post list
  useEffect(() => {
    if (isLoading || !hasMorePosts) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1 } // Trigger when the bottom of the list is reached
    );
    const { current: loadMoreElm } = loadMoreRef;
    if (loadMoreElm) {
      observer.observe(loadMoreElm);
    }
    return () => {
      observer.disconnect();
    };
  }, [isLoading, hasMorePosts, loadMorePosts]);
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex
      justify="center"
      minH="100vh"
      bg={colorMode === "light" ? "white" : "gray.900"}
      margin={0}
    >
      {!isMobile && (
        <Box w="auto" mx={0} display={{ base: "block", md: "block" }}>
          <Divider orientation="vertical" />
        </Box>
      )}
      <Box
        maxW={isMobile ? "100%" : "10000px"}
        minW={isMobile ? "90%" : "auto"}
        border="none" // Remove border from the container
      >
        <Button
          bg="#6899fe"
          _hover={{ background: "#9bbafa" }}
          rounded="md"
          size="sm"
          textColor="white"
          onClick={handleToggleForm}
          fontWeight="bold"
          mt="16"
          mb="6"
          ml={isMobile ? "40%" : "40%"}
          w={isMobile ? "s" : "110px"}
          py={"5"}
          leftIcon={isOpen ? <FiX /> : <BsMusicNote />}
        >
          {isOpen ? "Cancel" : "New Post"}
        </Button>
        {isOpen && <NewPost />}
        <PostsList posts={posts} />
        {isLoading && (
          <Center>
            <Spinner />
          </Center>
        )}
        <div ref={loadMoreRef} />
      </Box>
      {!isMobile && (
        <Box w="auto" mx={0} display={{ base: "block", md: "block" }}>
          <Divider orientation="vertical" />
        </Box>
      )}
    </Flex>
  );
}
