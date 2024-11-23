import React, { useState } from "react";
import { Box, Button, Stack, useBreakpointValue, useColorMode, Text, Flex } from "@chakra-ui/react";
import { Nav_Buttons } from "./buttons";

const Sidebar = ({
  settings,
  showSettings,
  groups,
  showGroups,
  calls,
  showCalls,
  setUserPressed,
  requests,
  showRequests,
}) => {
  const [selected, setSelected] = useState(0);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode } = useColorMode();

  const handleTabClick = (index) => {
    setSelected(index);
    switch (index) {
      case 0:
        showSettings(false);
        showGroups(false);
        showCalls(false);
        showRequests(false);
        setUserPressed("");
        break;
      case 1:
        showSettings(false);
        showGroups(true);
        showCalls(false);
        showRequests(false);
        setUserPressed("");
        break;
      case 2:
        showSettings(false);
        showGroups(false);
        showCalls(false);
        showRequests(true);
        setUserPressed("");
        break;
      case 3:
        showSettings(true);
        showGroups(false);
        showCalls(false);
        showRequests(false);
        setUserPressed("");
        break;
      default:
        break;
    }
  };


  return (
    <Stack direction={"row"} align={"center"} width="100%" spacing={0}>
      <Box borderBottom="1px solid #6899FE" width={isMobile ? "100%" : "30%"} borderRight="1px #E2E8F0 solid" >
        <Stack direction={"row"} alignItems={"center"} spacing={0.5} width={isMobile ? "70%" : "50%"}>
          {Nav_Buttons.map((el, index) => (
            <Button
              height={isMobile ? "40px" : "calc(1.5rem + (1vw - 0.2rem))"}
              key={el.index}
              onClick={() => handleTabClick(index)}
              bg={selected === index ? "#6899FE" : "transparent"}
              color={selected === index ? "#fff" : colorMode === "light" ? "#6899FE" : "#fff"}
              borderRadius="10px 10px 0px 0px"
              _hover={{ bg: selected === index ? "#6899FE" : "gray.200" }}
              _selected={{
                bg: "#6899FE",
                borderBottom: "1px solid",
                borderColor: "#6899FE",
              }}
              _focus={{ boxShadow: "none" }}
              _active={{ bg: selected === index ? "#6899FE" : "gray.200" }}
              px={4}
              py={1}
              borderRight="1px solid #6899FE"
              borderLeft="1px solid #6899FE"
              borderTop="1px solid #6899FE"
              width="33.33%"
              fontSize={isMobile ? "15px" : "calc(0.15rem + (0.76vw - 0.2rem))"}
            >
              {el.label}
            </Button>
          ))}
        </Stack>
      </Box>
      {!isMobile && selected !== null ? (
        <Flex flex={1} alignItems="center" justifyContent="center" px={5} borderBottom="1px #E2E8F0 solid" width="70%">
          <Text
            fontWeight="bold"
            fontSize="22px"
            color="#6899FE"
            backgroundColor="#D9D9D9AB"
          >
            {Nav_Buttons[selected].label}
          </Text>
        </Flex>
      ) : null}
    </Stack>
  );
};

export default Sidebar;