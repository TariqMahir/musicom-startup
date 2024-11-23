import {
  Avatar as ChakraAvatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FiDownload, FiFile } from 'react-icons/fi';
import { TbFileDots } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import { Message_Options } from './buttons';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useAuth } from 'hooks/auth';
import { useUser } from 'hooks/users';
import { PROTECTED } from 'lib/routes';


const DocMsg = ({ el, menu }) => {
  const { colorMode } = useColorMode();
  const [downloadLink, setDownloadLink] = useState(null); // State to store the download link
  const timestampMilliseconds =
    el.date?.seconds * 1000 + el.date?.nanoseconds / 1e6;

  // Create a Date object from the combined timestamp
  const dateObject = new Date(timestampMilliseconds);
  // Get the current date and time
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  const timeDifference = currentDate.getTime() - dateObject.getTime();

  let displayText;

  if (timeDifference < 6000) {
    // Less than 1 minute
    // The message was sent less than 1 minute ago, display "Now"
    displayText = 'Now';
  } else if (timeDifference < 86400000) {
    // Less than 24 hours
    // The message is from the same day, so display just the hours and minutes
    displayText = dateObject.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    // The message is from a different day, so display both date and time
    displayText = dateObject.toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const handleDownloadClick = () => {
    console.log(el.message);
    // Set the download link to the generated URL and trigger a click event
    setDownloadLink(el.message);
    window.open(el.message);
  };

  function extractFileName(url) {
    const regex = /\/([^/]+)\?/;
    const matches = url.match(regex);
    if (matches && matches.length > 1) {
      const filePath = matches[1];
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
      return decodeURIComponent(fileName.split('%2F').pop());
    }
    return null;
  }

  return (
    <Stack direction={'row'} justifyContent={el.incoming ? 'start' : 'end'}>
      {el.incoming && (
        <Box position="relative" mt={{ base: 6, md: 6 }}>
          <Text fontSize={{ base: '3xs', md: '3xs' }}>{displayText}</Text>
        </Box>
      )}
      <Box
        p={1.5}
        backgroundColor={el.incoming ? 'gray.100' : 'blue.500'}
        borderRadius={'md'}
        width={'max-content'}
      >
        <Stack spacing={2}>
          <Stack
            p={2}
            direction={'row'}
            spacing={3}
            alignItems={'center'}
            backgroundColor={
              colorMode === 'dark'
                ? el.incoming
                  ? 'gray.300'
                  : 'blue.300'
                : 'white'
            }
          >
            {/* <IconButton
              backgroundColor="transparent"
              _hover={{ backgroundColor: "transparent" }}
              color={
                colorMode === "dark"
                  ? el.incoming
                    ? "black"
                    : "white"
                  : "black"
              }
              icon={<FiFile />}
              size={"sm"}
              onClick={handleDownloadClick}
            /> */}
            <Text
              fontSize={{ base: '3xs', md: '2xs' }}
              color={
                colorMode === 'dark'
                  ? el.incoming
                    ? 'black'
                    : 'white'
                  : 'black'
              }
              variant={'caption'}
            >
              {extractFileName(el.message)}
            </Text>
            <IconButton
              size={'sm'}
              color={
                colorMode === 'dark'
                  ? el.incoming
                    ? 'black'
                    : 'white'
                  : 'black'
              }
              icon={<FiDownload />}
              onClick={handleDownloadClick} // Handle download button click
            />
          </Stack>
          {/* <Link as={Link} to={el.message} target="_blank" download>
            {extractFileName(el.message)}
          </Link> */}
          {/* <Text variant={"body2"} color={el.incoming ? "black" : "white"}>
            {el.message}
          </Text> */}
        </Stack>
      </Box>
      {el.outgoing && (
        <Box position="relative" mt={{ base: 6, md: 6 }}>
          <Text fontSize={{ base: '3xs', md: '3xs' }}>{displayText}</Text>
        </Box>
      )}
      {/* {menu && <MessageOptions />} */}
      {/* <a href={el.message} download={el.message} style={{ display: "none" }} /> */}
    </Stack>
  );
};

const LinkMsg = ({ el, menu }) => {
  return (
    <Stack direction={'row'} justifyContent={el.incoming ? 'start' : 'end'}>
      <Box
        p={1.5}
        backgroundColor={el.incoming ? 'gray.100' : 'blue.500'}
        borderRadius={'md'}
        width={'max-content'}
      >
        <Stack
          p={2}
          spacing={3}
          alignItems={'center'}
          backgroundColor={'white'}
          borderRadius={'md'}
        >
          {/* <img
            src={el.preview}
            alt={el.message}
            style={{ maxHeight: 210, borderRadius: "10px" }}
          /> */}
          <Stack spacing={2}>
            {/* <Text variant={"subtitle2"} color={el.incoming ? "black" : "white"}>
              Creating Chat App
            </Text> */}
            <Text
              variant={'subtitle2'}
              as={Link}
              to={el.message}
              color={'blue'}
            >
              {el.message}
            </Text>
          </Stack>
          {/* <Text variant={"body2"} color={el.incoming ? "black" : "white"}>
            {el.message}
          </Text> */}
        </Stack>
      </Box>
      {/* {menu && <MessageOptions />} */}
    </Stack>
  );
};

const ReplyMsg = ({ el, menu }) => {
  return (
    <Stack direction={'row'} justifyContent={el.incoming ? 'start' : 'end'}>
      <Box
        p={1.5}
        backgroundColor={el.incoming ? 'gray.100' : 'blue.500'}
        borderRadius={'md'}
        width={'max-content'}
      >
        <Stack spacing={2}>
          <Stack
            p={2}
            direction={'column'}
            spacing={3}
            alignItems={'center'}
            backgroundColor={el.incoming ? 'blue.500' : 'gray.100'}
            borderRadius={'md'}
          >
            <Text variant={'body2'} color={el.incoming ? 'white' : 'black'}>
              {el.reply}
            </Text>
          </Stack>
          <Text variant={'body2'} color={el.incoming ? 'black' : 'white'}>
            {el.message}
          </Text>
        </Stack>
      </Box>
      {/* {menu && <MessageOptions />} */}
    </Stack>
  );
};

const MediaDisplay = ({ el }) => {
  // Helper function to determine the media type
  const getMediaType = (url) => {
    // Extract the file extension
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    } else {
      return 'unknown';
    }
  };

  const mediaType = getMediaType(el.message);

  switch (mediaType) {
    case 'image':
      return (
        <img
          src={el.message}
          alt="Media content"
          style={{ maxHeight: 210, borderRadius: '10px', width: 'auto' }}
        />
      );
    case 'video':
      return (
        <video
          src={el.message}
          controls
          style={{ maxHeight: 210, borderRadius: '10px', width: 'auto' }}
        />
      );
    case 'audio':
      return <audio-player src={el.message} title="Audio File"></audio-player>;
    default:
      // Optionally handle unknown types, such as displaying a message or icon
      return (
        <p>
          Unsupported media type{' '}
          {el.message.split('.').pop().toLowerCase().split('?')[0]}
        </p>
      );
  }
};
const MediaMsg = ({ el, menu }) => {
  const timestampMilliseconds =
    el.date?.seconds * 1000 + el.date?.nanoseconds / 1e6;

  // Create a Date object from the combined timestamp
  const dateObject = new Date(timestampMilliseconds);
  // Get the current date and time
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  const timeDifference = currentDate.getTime() - dateObject.getTime();

  let displayText;

  if (timeDifference < 6000) {
    // Less than 1 minute
    // The message was sent less than 1 minute ago, display "Now"
    displayText = 'Now';
  } else if (timeDifference < 86400000) {
    // Less than 24 hours
    // The message is from the same day, so display just the hours and minutes
    displayText = dateObject.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    // The message is from a different day, so display both date and time
    displayText = dateObject.toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return (
    <Stack direction={'row'} justifyContent={el.incoming ? 'start' : 'end'}>
      {el.incoming && (
        <Box position="relative" mt={{ base: 3, md: 2.5 }}>
          <Text fontSize={{ base: '3xs', md: '3xs' }}>{displayText}</Text>
        </Box>
      )}
      <Box
        p={1.5}
        backgroundColor={el.incoming ? 'gray.100' : 'blue.500'}
        borderRadius={'md'}
        width={'max-content'}
      >
        <Stack spacing={1}>
          {/* <img
            src={el.message}
            alt={el.message}
            style={{ maxHeight: 210, borderRadius: "10px" }}
          />
           */}
          <MediaDisplay el={el} />
          {/* <Text variant={"body2"} color={el.incoming ? "black" : "white"}>
            {el.message}
          </Text> */}
        </Stack>
      </Box>
      {el.outgoing && (
        <Box position="relative" mt={{ base: 3, md: 2.5 }}>
          <Text fontSize={{ base: '3xs', md: '3xs' }}>{displayText}</Text>
        </Box>
      )}
      {/* {menu && <MessageOptions />} */}
    </Stack>
  );
};

const TextMsg = ({ el, menu, user, searchQuery }) => {
  const timestampMilliseconds = el.date
    ? el.date?.seconds * 1000 + el.date?.nanoseconds / 1e6
    : el.createdAt?.seconds * 1000 + el.createdAt?.nanoseconds / 1e6;
  // Create a Date object from the combined timestamp
  const dateObject = new Date(timestampMilliseconds);
  // Get the current date and time
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  const timeDifference = currentDate.getTime() - dateObject.getTime();
  let displayText;

  if (timeDifference < 6000) {
    // Less than 1 minute
    // The message was sent less than 1 minute ago, display "Now"
    displayText = 'Now';
  } else if (timeDifference < 86400000) {
    // Less than 24 hours
    // The message is from the same day, so display just the hours and minutes
    displayText = dateObject.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    // The message is from a different day, so display both date and time
    displayText = dateObject.toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const { user: userr } = useUser(el?.sentBy ? el.sentBy : 'nope');
  return (
    <Stack
      direction={'row'}
      justifyContent={
        el.incoming
          ? 'start'
          : el?.sentBy !== undefined && el?.sentBy !== user?.id
          ? 'start'
          : 'end'
      }
    >
      {el.incoming ? (
        <Box
          position="relative"
          mt={{
            base: 3,
            md: 2.5,
          }}
        >
          <Text fontSize={{ base: '3xs', md: '3xs' }}>{displayText}</Text>
        </Box>
      ) : (
        el?.sentBy &&
        el?.sentBy !== user?.id && (
          <Box position="relative" mt={{ base: 3, md: 2.5 }}>
            <Text fontSize={{ base: '3xs', md: '3xs' }}>{displayText}</Text>
          </Box>
        )
      )}
      {el?.sentBy ? (
        el.sentBy !== user?.id &&
        userr && (
          <ChakraAvatar
            as={Link}
            to={`${PROTECTED}/profile/${userr?.username}`}
            size={'sm'}
            src={userr?.avatar || ''}
            _hover={{ cursor: 'pointer', opacity: '0.8' }}
            // border="2px"
            // borderColor={"blue"}
          />
        )
      ) : (
        <></>
      )}
      <Box
        p={1.5}
        backgroundColor={
          el?.message.toLowerCase().includes(searchQuery?.toLowerCase())
            ? 'yellow'
            : el?.incoming
            ? 'gray.100'
            : el?.sentBy !== undefined && el?.sentBy !== user?.id
            ? 'gray.100'
            : 'blue.500'
        }
        borderRadius={'md'}
        width={'max-content'}
        wordBreak="break-all"
      >
        <Text
          variant={'body2'}
          fontSize={'sm'}
          color={
            el.message.includes(searchQuery)
              ? 'black'
              : el.incoming ||
                (el?.sentBy !== undefined && el?.sentBy !== user?.id)
              ? 'black'
              : 'white'
          }
        >
          {el.message}
        </Text>
      </Box>
      {el.outgoing ? (
        <Box position="relative" mt={{ base: 3, md: 2.5 }}>
          <Text fontSize={{ base: '3xs', md: '3xs' }}>{displayText}</Text>
        </Box>
      ) : (
        el?.sentBy !== undefined &&
        el?.sentBy === user?.id && (
          <Box position="relative" mt={{ base: 3, md: 2.5 }}>
            <Text fontSize={{ base: '3xs', md: '3xs' }}>{displayText}</Text>
          </Box>
        )
      )}
      {/* {menu && <MessageOptions />} */}
    </Stack>
  );
};

const Timeline = ({ el }) => {
  return (
    <Stack
      direction={'row'}
      alignItems={'center'}
      justifyContent={'space-between'}
    >
      <Divider width={'46%'} />
      <Text variant={'caption'}>{el.text}</Text>
      <Divider width={'46%'} />
    </Stack>
  );
};

const MessageOptions = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box position="relative">
      <Menu>
        <MenuButton
          isActive={isOpen}
          id="basic-button"
          aria-controls={isOpen ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={isOpen ? 'true' : undefined}
          onClick={() => setIsOpen((prev) => !prev)}
          rightIcon={<ChevronDownIcon />}
        >
          <BsThreeDotsVertical size={15} />
        </MenuButton>
        <MenuList placement="bottom-end" position="absolute" top="0" mt="2">
          {Message_Options.map((el) => (
            <MenuItem key={el.title} onClick={() => {}}>
              {el.title}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export { Timeline, TextMsg, MediaMsg, ReplyMsg, LinkMsg, DocMsg, MediaDisplay };
