// import React from "react";
// import { Box, Text } from "@chakra-ui/react";

// const UserCard = ({ user }) => {
//   return (
//     <Box borderWidth="1px" borderRadius="md" p={4}>
//       <Text>{user.username}</Text>
//       <Text>{user.role}</Text>
//       {/* Add other user information to display */}
//     </Box>
//   );
// };

// export default UserCard;

import {
  Heading,
  Box,
  Center,
  Text,
  Stack,
  Button,
  Link,
  Badge,
  useColorModeValue,
  Wrap,
  WrapItem,
  Flex,
  useColorMode,
  Divider,
  useBreakpointValue,
} from '@chakra-ui/react';
import Avatar from 'components/profile/Avatar';
import { PROTECTED } from 'lib/routes';
import logoM from 'Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png';

export default function UserCard({ user, isNetwork, extraInfo }) {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex
      width={'100%'}
      minHeight="100%"
      height={'auto'}
      bg={useColorModeValue('white', 'gray.900')}
      boxShadow={'xl'}
      rounded={'lg'}
      borderWidth="0.2px" // Sets the width of the border
      borderColor="rgba (72, 50,133, 0)" // Sets the color of the border
      direction="row" // Ensures the content is laid out in a row
      align="center" // Vertically aligns items in the center
      p={2}
      style={{
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)', // Custom CSS for shadow
      }}
      radius={5}
    >
      {/* Avatar on the left */}
      <Box
        p={3}
        borderRightWidth="0.2px"
        paddingRight={5}
        borderColor="rgba (72, 50,133, 0)"
      >
        <Avatar
          size={'lg'}
          user={user}
          alt={'Avatar Alt'}
          mb={0}
          pos={'relative'}
          post={true}
        />
      </Box>

      {/* Divider */}
      <Box
        borderRightWidth={1}
        ml={1}
        mr={-4}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      />

      {/* User information on the right */}
      <Box pl={6} mt={2}>
        {/* Full Name and Username */}
        <Flex flexDirection={'row'} mb={3}>
          <Wrap spacing={1} mt={1}>
            <WrapItem>
              <Heading
                fontSize={{ base: '2xs', md: 'xs' }}
                fontFamily={'body'}
                as={Link}
                href={`${PROTECTED}/profile/${user.username}`}
              >
                {user?.fullName
                  ? user.fullName
                  : user?.businessName
                  ? user?.businessName
                  : ''}
              </Heading>
            </WrapItem>
            <Box />
            <WrapItem>
              <Text
                fontWeight={200}
                fontSize={{ base: '2xs', md: 'xs' }}
                as={Link}
                href={`${PROTECTED}/profile/${user.username}`}
                colour="rgba (72, 50,133, 0)"
                mt={-0.5}
              >
                @{user.username}
              </Text>
            </WrapItem>
          </Wrap>
        </Flex>
        {extraInfo && (
          <Box>
            <Text color="red.500" fontWeight="bold">
              {extraInfo}
            </Text>
          </Box>
        )}

        {/* Role, Instruments, Gender, Signed Status, and Genres */}
        {isNetwork && (
          <Wrap>
            <WrapItem
              borderRightWidth={1}
              paddingRight={1}
              borderColor="gray.200"
            >
              <Text
                fontWeight={400}
                fontSize={{ base: '2xs', md: 'xs' }}
                color={'red.700'}
              >
                {`${user.role}`}
              </Text>
            </WrapItem>
            {user?.instrument &&
              user?.instrument.length > 0 &&
              user?.instrument.map((instrument, index) => (
                <WrapItem
                  key={index}
                  borderRightWidth={1}
                  paddingRight={1}
                  borderColor="gray.200"
                >
                  <Text
                    fontWeight={400}
                    fontSize={{ base: '2xs', md: 'xs' }}
                    color={'green.700'}
                    ml={0.5}
                  >
                    {`${instrument}`}
                  </Text>
                </WrapItem>
              ))}
            <WrapItem
              borderRightWidth={1}
              paddingRight={1}
              borderColor="gray.200"
            >
              <Text
                fontWeight={400}
                fontSize={{ base: '2xs', md: 'xs' }}
                color={'blue.700'}
              >
                {`${user.gender}`}
              </Text>
            </WrapItem>
            <WrapItem
              borderRightWidth={1}
              paddingRight={1}
              borderColor="gray.200"
            >
              <Text
                fontWeight={400}
                fontSize={{ base: '2xs', md: 'xs' }}
                color={'orange.400'}
              >
                {user.signed ? 'Signed' : 'Not Signed'}
              </Text>
            </WrapItem>
            {user?.genres &&
              user?.genres.length > 0 &&
              user?.genres.map((genre, index) => (
                <WrapItem
                  key={index}
                  borderRightWidth={1}
                  paddingRight={1}
                  borderColor="gray.200"
                >
                  <Text
                    fontWeight={400}
                    fontSize={{ base: '2xs', md: 'xs' }}
                    color={'purple.700'}
                    ml={0.5}
                  >
                    {`${genre}`}
                  </Text>
                </WrapItem>
              ))}
            {user?.languages &&
              Array.isArray(user.languages) &&
              user.languages.length > 0 &&
              user.languages.map((language, index) => (
                <WrapItem key={index}>
                  <Text
                    fontWeight={400}
                    fontSize={{ base: '2xs', md: 'xs' }}
                    color={'black'}
                    ml={0.5}
                  >
                    {`${language}`}
                  </Text>
                </WrapItem>
              ))}
          </Wrap>
        )}

        {/* Action buttons
          <Stack mt={8} direction={"row"} spacing={4}>
            <Button
              flex={1}
              fontSize={"sm"}
              rounded={"full"}
              _focus={{
                bg: "gray.200",
              }}
            >
              Message
            </Button>
            <Button
              flex={1}
              fontSize={"sm"}
              rounded={"full"}
              bg={"blue.400"}
              color={"white"}
              boxShadow={
                "0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)"
              }
              _hover={{
                bg: "blue.500",
              }}
              _focus={{
                bg: "blue.500",
              }}
            >
              Follow
            </Button>
          </Stack> */}
      </Box>
    </Flex>
  );
}
