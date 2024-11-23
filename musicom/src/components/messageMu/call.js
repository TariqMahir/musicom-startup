import { SearchIcon } from "@chakra-ui/icons";
import {
  AvatarBadge,
  Badge,
  Box,
  Divider,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  useBreakpointValue,
  useColorMode,
  Avatar,
} from "@chakra-ui/react";
import { Phone, Plus } from "phosphor-react";
import { Link } from "react-router-dom";
import { CallLogs, ChatList } from "./buttons";
import CerateGroup from "./createGroup";
import { useState } from "react";
import { CallLogElement } from "./callElement";
import StartCall from "./startCall";

const ChatElement = ({ id, name, img, msg, time, unread, online }) => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  return (
    <Box
      width={"100%"}
      borderRadius={"lg"}
      backgroundColor={colorMode === "light" ? "gray.100" : "whiteAlpha.100"}
      p={2}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Box>
          <Stack direction={"row"} spacing={2} align={"center"}>
            <Avatar size={"sm"} src={img}>
              {online && <AvatarBadge boxSize="1.25em" bg="green.500" />}
            </Avatar>
            <Stack spacing={0.3}>
              <Text
                variant={"subtitle2"}
                as="b"
                fontSize={isMobile ? "xs" : "sm"}
              >
                {name}
              </Text>
              <Text
                variant={"caption"}
                as="p"
                fontSize={isMobile ? "xs" : "sm"}
              >
                {msg}
              </Text>
            </Stack>
          </Stack>
        </Box>
        <Stack spacing={1} alignItems={"center"}>
          <Text
            fontWeight={600}
            fontSize={isMobile ? "xs" : "sm"}
            variant={"caption"}
          >
            {time}
          </Text>
          {unread > 0 ? (
            <Badge
              backgroundColor={"blue"}
              color="white"
              size={isMobile ? "lg" : "xl"}
              rounded={"xl"}
            >
              {unread}
            </Badge>
          ) : (
            <Box p={2}></Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

const Search = () => {
  return (
    <InputGroup borderRadius={"xl"} backgroundColor={"transparent"}>
      <InputLeftElement pointerEvents="none">
        <SearchIcon color="gray.300" />
      </InputLeftElement>
      <Input type="text" placeholder="Search..." color={"black"} />
    </InputGroup>
  );
};
const Call = () => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [openDialog, setOpenDialog] = useState(false);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <Stack direction={"row"} width={"100%"}>
        {/* Left */}
        <Box
          position={"relative"}
          height={"100%"}
          width={isMobile ? "auto" : "30%"}
          backgroundColor={colorMode === "light" ? "#fff" : "blackAlpha.300"}
          boxShadow={"sm"}
          zIndex={2}
        >
          <Stack spacing={2} p={3} height={"100%"}>
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Text fontSize={"xl"} as={"b"}>
                Call Logs
              </Text>
            </Stack>
            <Stack width={"100%"}>
              <Search />
            </Stack>
            <Stack
              direction={"row"}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Text
                variant={"subtitle2"}
                as={Link}
                color={"blue"}
                fontSize={14}
              >
                Start Conversation
              </Text>
              <IconButton
                color={"blue"}
                backgroundColor={"transparent"}
                onClick={() => {
                  setOpenDialog(true);
                }}
              >
                <Phone />
              </IconButton>
            </Stack>
            <Divider />
            <Stack
              direction={"column"}
              flexGrow={1}
              overflow={"scroll"}
              height={"100%"}
              spacing={2}
            >
              <Stack spacing={2.4}>
                {/* Call Logs */}
                {CallLogs.map((el) => (
                  <CallLogElement {...el} />
                ))}
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Right */}
        {openDialog && (
          <StartCall open={openDialog} handleClose={handleCloseDialog} />
        )}
      </Stack>
    </>
  );
};

export default Call;
