import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import {
  Bell,
  CaretLeft,
  Image,
  Info,
  Key,
  Lock,
  Note,
  PencilCircle,
} from "phosphor-react";

const Settings = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  const list = [
    {
      key: 0,
      icon: <Bell size={20} />,
      title: "Notifications",
      onclick: () => {},
    },
    {
      key: 1,
      icon: <Lock size={20} />,
      title: "Privacy",
      onclick: () => {},
    },
    {
      key: 2,
      icon: <Key size={20} />,
      title: "Security",
      onclick: () => {},
    },
    {
      key: 3,
      icon: <PencilCircle size={20} />,
      title: colorMode === "light" ? "Set to Dark" : "Set to Light",
      onclick: () => {
        toggleColorMode();
      },
    },
    {
      key: 4,
      icon: <Image size={20} />,
      title: "Chat Wallpaper",
      onclick: () => {},
    },
    {
      key: 5,
      icon: <Note size={20} />,
      title: "Request Account Info",
      onclick: () => {},
    },
    {
      key: 6,
      icon: <Info size={20} />,
      title: "Help",
      onclick: () => {},
    },
  ];

  return (
    <Stack direction={"row"} width={"100%"}>
      <Box
        overflowY={"scroll"}
        height={"100%"}
        width={320}
        backgroundColor={colorMode === "light" ? "#F8FAFF" : "whiteAlpha.100"}
      >
        <Stack p={4} spacing={5}>
          {/* Header */}
          <Stack direction={"row"} alignItems={"center"} spacing={3}>
            <IconButton backgroundColor="transparent">
              <CaretLeft
                size={24}
                color={colorMode === "light" ? "#4B4B4B" : "white"}
              />
            </IconButton>
            <Text variant={"h6"} fontSize={20} fontWeight={"bold"}>
              Settings
            </Text>
          </Stack>
          {/* Profile */}
          <Stack direction={"row"} spacing={3}>
            <Avatar src="" alt="Name" height={12} width={12} />
            <Stack spacing={0.5}>
              <Text variant={"article"} fontSize={"lg"}>
                Alessandro Lentini
              </Text>
              <Text variant={"body2"} fontSize={"sm"}>
                CTO
              </Text>
            </Stack>
          </Stack>
          {/* List of Options */}
          <Stack spacing={4}>
            {list.map(({ key, icon, title, onclick }) => (
              <Stack spacing={2} cursor={"pointer"} onClick={onclick}>
                <Stack direction={"row"} spacing={2} alignItems={"center"}>
                  {icon}
                  <Text variant={"body2"} fontSize={"sm"}>
                    {title}
                  </Text>
                </Stack>
                {key !== 7 && <Divider />}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};

export default Settings;
