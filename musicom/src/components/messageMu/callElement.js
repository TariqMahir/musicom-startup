import {
  Avatar,
  AvatarBadge,
  Box,
  IconButton,
  Stack,
  Text,
  useBreakpointValue,
  useColorMode,
} from "@chakra-ui/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  VideoCamera,
} from "phosphor-react";

const CallLogElement = ({ online, img, name, incoming, missed }) => {
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
        <Stack direction={"row"} alignItems={"center"} spacing={2}>
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

            <Stack direction={"row"} alignItems={"center"} spacing={1}>
              {incoming ? (
                <ArrowDownLeft color={missed ? "red" : "green"} />
              ) : (
                <ArrowUpRight color={missed ? "red" : "green"} />
              )}
              <Text
                variant={"caption"}
                as="p"
                fontSize={isMobile ? "xs" : "sm"}
              >
                Yesterday 12:15
              </Text>
            </Stack>
          </Stack>
        </Stack>
        <IconButton>
          <Phone color="green" />
        </IconButton>
      </Stack>
    </Box>
  );
};

const CallElement = ({ online, img, name }) => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  return (
    <Box width={"100%"} borderRadius={"lg"} p={2}>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={2}>
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
          </Stack>
        </Stack>
        <Stack direction={"row"} alignItems={"center"}>
          <IconButton backgroundColor={"transparent"}>
            <Phone color="green" />
          </IconButton>
          <IconButton backgroundColor={"transparent"}>
            <VideoCamera color="green" />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};
export { CallLogElement, CallElement };
