import {
  Box,
  Button,
  IconButton,
  Flex,
  Stack,
  Text,
  useColorMode,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
  useToast,
} from '@chakra-ui/react';
import { FaEllipsisH } from 'react-icons/fa';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { CiEdit } from 'react-icons/ci';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import Avatar from 'components/profile/Avatar';
import { useUser } from 'hooks/users';
import { useDeletePost } from 'hooks/posts';
import { formatDistanceToNow } from 'date-fns';
import UsernameButton from 'components/profile/UsernameButton';
import { useAuth } from 'hooks/auth';

export default function Header({ post }) {
  const { id, uid, date } = post;
  const { user, isLoading } = useUser(uid); // Pass the `uid` prop to the `useUser` hook
  const { colorMode } = useColorMode(); // Access the current color mode
  const { deletePost, isLoading: deletePostLoading } = useDeletePost(id);
  const toast = useToast();
  const authUser = useAuth();
  if (isLoading || !user) return 'Loading...'; // Check if user data is still loading or if no user is available

  const bgColor = colorMode === 'light' ? '#EDF7FE' : 'gray.900';
  const borderColor = colorMode === 'light' ? 'gray.100' : 'gray.700';
  const textColor = colorMode === 'light' ? 'gray.500' : 'gray.400';

  const handleDeletePost = async () => {
    try {
      await deletePost();
    } catch (error) {
      toast({
        title: 'An error occurred while deleting the post.',
        description: error.toString(),
        status: 'error',
        isClosable: true,
        position: 'top',
        duration: 5000,
      });
    }
  };
  return (
    <Flex
      justifyContent={'space-between'}
      borderBottom={`2px solid ${borderColor}`}
      bg={bgColor}
      ml={0}
    >
      <Flex alignItems="center">
        <Box mr={2}></Box>
        <Avatar user={user} size="sm" post={true} />
        <Box ml="3" mt={1}>
          <UsernameButton user={user} />
          {/* <Text fontSize="sm" color={textColor}>
            {formatDistanceToNow(date)} ago
          </Text> */}
          <Stack p={1} />
        </Box>
      </Flex>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="Options"
          icon={<FaEllipsisH />}
          bg={bgColor}
          color={'gray'}
          mt={1}
          mr={1}
          _hover={{ backgroundColor: 'transparent' }}
          _active={{ backgroundColor: 'transparent' }}
          _after={{ backgroundColor: 'transparent' }}
        />
        <MenuList
          minWidth="5px"
          width="100px"
          p={0}
          border={'1.5px solid #EDF7FE'}
          borderRadius={'3%'}
        >
          {authUser?.user?.id === uid && (
            <MenuItem
              isLoading={deletePostLoading}
              onClick={handleDeletePost}
              borderBottom={'0.5px solid #EDF7FE'}
              fontSize={'xs'}
              pl={'25%'}
            >
              Delete
              <Box as="span" ml="1">
                <RiDeleteBin6Line />
              </Box>
            </MenuItem>
          )}
          {authUser?.user?.id === uid && (
            <MenuItem
              pl={'35%'}
              borderBottom={'0.5px solid #EDF7FE'}
              fontSize={'xs'}
            >
              Edit
              <Box as="span" ml="1">
                <CiEdit />
              </Box>
            </MenuItem>
          )}
          <MenuItem pl="25%" fontSize={'xs'}>
            Report
            <Box as="span" ml="1">
              <HiOutlineDocumentReport />
            </Box>
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}
