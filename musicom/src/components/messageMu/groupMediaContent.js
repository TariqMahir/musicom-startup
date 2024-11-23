import React from 'react';
import { Box, Text, IconButton, Image, Stack, useColorMode, Link as ChakraLink, Flex } from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';

const GroupMediaContent = ({ message }) => {
  const { colorMode } = useColorMode();
  const textColor = colorMode === 'dark' ? "white" : "black";
  const bgColor = colorMode === 'dark' ? "gray.700" : "gray.100";

  // Extract filename from URL
  const extractFileName = (url) => {
    if (!url) return 'Unknown file';
    return decodeURIComponent(url.split('/').pop().split('?')[0]);
  };

  // Handle download action
  const handleDownload = (url) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = extractFileName(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle media type and return appropriate JSX
  const renderMedia = (msg) => {
    const type = msg.subtype;
    const content = msg.message; // Access the message content
    if (!content) {
      console.log("No content found for message:", msg);
      return <Text color={textColor} fontSize="sm">No content available</Text>;
    }
    switch (type) {
      case 'img':
        return <Image src={content} alt="Uploaded Media" borderRadius="md" boxSize="100px" />;
      case 'doc':
        return (
          <Flex alignItems="center" backgroundColor={bgColor} p={2} borderRadius="md" boxSize="100px" >
            <ChakraLink href={content} fontSize="2xs" boxSize="100px" >
              {extractFileName(content)}
            </ChakraLink>
            <IconButton
              icon={<FiDownload />}
              onClick={() => handleDownload(content)}
              aria-label="Download"
              size="sm"
              ml={2}
            />
          </Flex>
        );
      case 'link':
        return (
          <Text as={ChakraLink} href={content} color="blue.500" fontSize="sm">
            {content}
          </Text>
        );
      default:
        return <Text color={textColor} fontSize="sm">Unsupported format</Text>;
    }
  };

  return (
    <Box backgroundColor={message.incoming ? "#E2E8F0" : "#E2E8F0"} borderRadius="md" p={1}>
      {renderMedia(message)}
    </Box>
  );
};

export default GroupMediaContent;
