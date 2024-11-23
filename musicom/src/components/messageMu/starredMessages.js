import {
  Box,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
  SimpleGrid,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { ToggleSidebar, UpdateSidebarType } from "./redux/slices/app";
import { useDispatch } from "react-redux";
import { FiX } from "react-icons/fi";
import { CaretLeft } from "phosphor-react";

import { SHARED_DOCS, SHARED_LINKS } from "./buttons";
import { DocMsg, LinkMsg } from "./msgTypes";
import Message from "./message";

const StarredMessages = () => {
  const dispatch = useDispatch();
  const { colorMode } = useColorMode();
  const [value, setValue] = useState(0);
  const handleChange = (newValue) => {
    setValue(newValue);
  };
  return (
    <Box w={470} height={"100%"} overflow="scroll">
      <Stack height={"100%"}>
        {/* Header */}
        <Box width={"100%"}>
          <Stack
            height={"100%"}
            p={2}
            direction={"row"}
            alignItems={"center"}
            spacing={3}
            backgroundColor={
              colorMode === "light" ? "gray.100" : "whiteAlpha.100"
            }
          >
            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType("CONTACT"));
              }}
              icon={<CaretLeft />}
            />
            <Text
              color={colorMode === "light" ? "black" : "white"}
              variant={"subtitle2"}
            >
              Starred Messages
            </Text>
          </Stack>
        </Box>

        {/* Body */}
        <Stack
          height={"100%"}
          position={"relative"}
          flexGrow={1}
          p={3}
          spacing={value === 1 ? 1 : 3}
        >
          <Message />
        </Stack>
      </Stack>
    </Box>
  );
};

export default StarredMessages;
