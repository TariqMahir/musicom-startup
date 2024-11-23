// src/index.js
import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Image,
  Flex,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Collapse,
  List,
  ListItem,
  Icon,
  useColorMode,
  SimpleGrid,
  Button,
} from '@chakra-ui/react';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import AudioPlayer from 'components/audioPlayer/audioPlayer'; // Correct import path for the audio player
import {
  FiChevronDown,
  FiChevronUp,
  FiFile,
  FiRepeat,
  FiMusic,
  FiVideo,
  FiPlay,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import Actions from './Actions';
import Header from './Header';

const isImage = (file) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const extension = file.split('.').pop().toLowerCase();
  return imageExtensions.includes(extension);
};

const isAudio = (file) => {
  const audioExtensions = ['mp3', 'wav', 'ogg'];
  const extension = file.split('.').pop().toLowerCase();
  return audioExtensions.includes(extension);
};

const isVideo = (file) => {
  const videoExtensions = ['mp4', 'webm', 'ogg'];
  const extension = file.split('.').pop().toLowerCase();
  return videoExtensions.includes(extension);
};

const extractFileName = (url) => {
  const regex = /\/([^/]+)\?/;
  const matches = url.match(regex);
  if (matches && matches.length > 1) {
    const filePath = matches[1];
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    return decodeURIComponent(fileName.split('%2F').pop());
  }
  return null;
};

export function RepostHeader({ originalPost, reposts }) {
  const { colorMode } = useColorMode(); // Access the current color mode
  const bgColor = colorMode === 'light' ? 'gray.100' : 'gray.700';
  const textColor = colorMode === 'light' ? 'black' : 'gray.400';
  const linkColor = colorMode === 'light' ? 'blue.500' : 'blue.300';

  return (
    <Flex
      width={'fit-content'}
      rounded={15}
      px={2}
      py={0.5}
      mt={1}
      ml={1}
      bg={'#EDF7FE'}
      border={'0.5px solid #C4C9CF'}
      alignItems={'center'}
    >
      <Icon as={FiRepeat} boxSize={3} color={textColor} mr={1} />
      <Text fontSize="xs" color={textColor}>
        from{' '}
        {reposts.length > 0 ? (
          <>
            {reposts.map((repost, index) => (
              <RouterLink
                key={index}
                to={`/protected/profile/${repost.username}`}
                color={linkColor}
                fontWeight="bold"
              >
                @{repost.username}
              </RouterLink>
            ))}
          </>
        ) : (
          <RouterLink
            to={`/protected/profile/${originalPost.username}`}
            color={linkColor}
            fontWeight="bold"
          >
            @{originalPost.username}
          </RouterLink>
        )}
      </Text>
    </Flex>
  );
}

export default function Post({ post, reposts }) {
  const { text, files, originalPost } = post;
  const [expanded, setExpanded] = useState(false);
  const { isOpen, onToggle, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAudioOpen,
    onOpen: onAudioOpen,
    onClose: onAudioClose,
  } = useDisclosure();
  const {
    isOpen: isVideoOpen,
    onOpen: onVideoOpen,
    onClose: onVideoClose,
  } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const maxMediaHeight = '250px';

  const isRepost = originalPost && originalPost.id;

  const handleImageClick = (url) => {
    setSelectedImage(url);
    onOpen();
  };

  const handleAudioClick = (url) => {
    setSelectedAudio(url);
    onAudioOpen();
  };

  const handleVideoClick = (url) => {
    setSelectedVideo(url);
    onVideoOpen();
  };

  const imageFiles = files.filter((file) => isImage(extractFileName(file)));
  const audioFiles = files.filter((file) => isAudio(extractFileName(file)));
  const videoFiles = files.filter((file) => isVideo(extractFileName(file)));
  const otherFiles = files.filter(
    (file) =>
      !isImage(extractFileName(file)) &&
      !isAudio(extractFileName(file)) &&
      !isVideo(extractFileName(file))
  );

  return (
    <Box
      p="0"
      mb={8}
      maxW={{ base: 'auto', md: '600px' }}
      minW={{ base: 'auto', md: '600px' }}
      textAlign="left"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      borderColor="rgba(128, 128, 128, 0.1)" // light gray with 10% opacity
      boxShadow="sm"
    >
      <Box>
        <Header post={post} />
        {isRepost && (
          <>
            {reposts && reposts.length > 0 ? (
              reposts.map((repost, index) => (
                <RepostHeader
                  key={index}
                  originalPost={repost.originalPost}
                  reposts={repost.reposts}
                />
              ))
            ) : (
              <RepostHeader originalPost={originalPost} reposts={[]} />
            )}
          </>
        )}

        <Box p={2} pb={'2'} mt={{ base: 0, md: 1 }}>
          {text && (
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              mb={4}
              whiteSpace="pre-wrap"
            >
              {text}
            </Text>
          )}

          {audioFiles.map((file, index) => (
            <Flex align="center" key={index}>
              <audio controls>
                <source src={file} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Flex>
          ))}

          {imageFiles.length > 1 || videoFiles.length > 1 ? (
            <Center>
              <SimpleGrid
                columns={[
                  imageFiles.length + videoFiles.length === 2 ? 1 : 2,
                  null,
                  (imageFiles.length + videoFiles.length) % 2 == 0
                    ? imageFiles.length + videoFiles.length !== 2
                      ? (imageFiles.length + videoFiles.length) / 2
                      : 2
                    : imageFiles.length + videoFiles.length === 3
                    ? 3
                    : 2,
                ]}
                spacing="10px"
              >
                {imageFiles.map((image, i) => (
                  <Box
                    key={i}
                    height={maxMediaHeight}
                    width={'100%'}
                    onClick={() => handleImageClick(image)}
                  >
                    <Image
                      src={image}
                      alt={extractFileName(image)}
                      objectFit="cover"
                      height="100%"
                      width={'100%'}
                      cursor="pointer"
                    />
                  </Box>
                ))}
                {videoFiles.map((video, i) => (
                  <Box
                    key={i}
                    height={maxMediaHeight}
                    width={'100%'}
                    position="relative"
                    onClick={() => handleVideoClick(video)}
                    cursor="pointer"
                  >
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      zIndex="1"
                      color="white"
                    >
                      <FiPlay size={48} color={'revert'} />
                    </Box>
                    <video
                      src={video}
                      style={{
                        objectFit: 'cover',
                        height: '100%',
                        width: '100%',
                      }}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Center>
          ) : imageFiles.length === 1 ? (
            imageFiles.map((image, i) => (
              <div
                key={i}
                onClick={() => handleImageClick(image)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                height={maxMediaHeight}
                width={'100%'}
              >
                <Image
                  src={image}
                  width={'100%'}
                  alt={extractFileName(image)}
                  objectFit="cover"
                  maxHeight={maxMediaHeight}
                  height={maxMediaHeight}
                />
              </div>
            ))
          ) : (
            videoFiles.length === 1 &&
            videoFiles.map((video, i) => (
              <Box
                key={i}
                height={maxMediaHeight}
                width={'100%'}
                onClick={() => handleVideoClick(video)}
              >
                <video
                  src={video}
                  style={{
                    width: '100%',
                    height: maxMediaHeight,
                    objectFit: 'cover',
                  }}
                  controls
                />
              </Box>
            ))
          )}

          {otherFiles.length > 0 && (
            <VStack align="start" spacing={2}>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FiFile boxSize={4} />}
                onClick={() => {
                  setExpanded(!expanded);
                }}
                rightIcon={expanded ? <FiChevronUp /> : <FiChevronDown />}
              >
                Files
              </Button>
              <Collapse in={expanded} animateOpacity>
                <List>
                  {otherFiles.map((file, index) => (
                    <ListItem key={index}>
                      <RouterLink to={file} target="_blank" download>
                        {extractFileName(file)}
                      </RouterLink>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </VStack>
          )}
        </Box>
        <Actions post={post} reposts={reposts} />
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(10px)" />
        <ModalContent p={0} m={0} bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" />
          <ModalBody p={0} m={0}>
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Selected Image"
                objectFit="contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isAudioOpen}
        onClose={onAudioClose}
        isCentered
        closeOnOverlayClick
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(10px)" />
        <ModalContent p={0} m={0} bg="transparent" boxShadow="none">
          <ModalCloseButton
            color="white"
            position="absolute"
            top="10px"
            right="10px"
            zIndex="10"
          />
          <ModalBody
            p={0}
            m={0}
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
          >
            {selectedAudio && <AudioPlayer src={selectedAudio} />}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isVideoOpen}
        onClose={onVideoClose}
        isCentered
        closeOnOverlayClick
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(10px)" />
        <ModalContent p={0} m={0} bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" />
          <ModalBody
            p={0}
            m={0}
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
          >
            {selectedVideo && (
              <video src={selectedVideo} width="100%" height="100%" controls />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
