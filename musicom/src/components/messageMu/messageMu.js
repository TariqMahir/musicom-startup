import React, { useEffect, useState } from "react";
import {
  Box,
  Center,
  Stack,
  useBreakpointValue,
  Flex
} from "@chakra-ui/react";
import { useAuth } from "hooks/auth";
import Chats from "./chats";
import UserMessage from "./userMessage";
import Sidebar from "./sidebar";
import Contact from "./contact";
import { dispatch, useSelector } from "./redux/store";
import SharedMessages from "./sharedMessages";
import StarredMessages from "./starredMessages";
import Settings from "./settings";
import Groups from "./group";
import Call from "./call";
import Requests from "./requests";
import { ToggleSidebar, UpdateSidebarType } from "./redux/slices/app";
import { useDispatch } from "react-redux";
import UserGroup from "./userGroups";
import GroupInfo from "./groupInfo";

const MessageMu = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { sidebar } = useSelector((store) => store.app);
  const [settings, showSettings] = useState(false);
  const [groups, showGroups] = useState(false);
  const [calls, showCalls] = useState(false);
  const [requests, showRequests] = useState(false);
  const { user, isLoading } = useAuth();
  const [userPressed, setUserPressed] = useState(
    window.location.pathname.split("/").pop() !== "messages"
      ? window.location.pathname.split("/").pop()
      : null
  );
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector((state) => state.app.sidebar.open);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  useEffect(() => {
    if (!user) return; // Check if user is defined
    const handleToggleSidebar = () => {
      dispatch(ToggleSidebar());
      dispatch(UpdateSidebarType("CONTACT"));
    };
    if (isSidebarOpen) {
      handleToggleSidebar();
    }
  }, [userPressed, user]);

  if (isLoading || !user) {
    return <Center>Loading...</Center>;
  }

  const renderChatsOrUserMessage = () => {
    if (userPressed) {
      return (
        <UserMessage
          setUserPressed={setUserPressed}
          userPressed={userPressed}
        />
      );
    } else {
      return (
        <>
          <Chats setUserPressed={setUserPressed} userPressed={userPressed} />
          {userPressed && (
            <UserMessage
              setUserPressed={setUserPressed}
              userPressed={userPressed}
            />
          )}
        </>
      );
    }
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroupId(groupId);
    setShowGroupInfo(false);
  };

  const renderGroupsOrUserGroups = () => {
    if (selectedGroupId) {
      if (isMobile) {
        if (showGroupInfo) {
          return (
            <GroupInfo
              groupId={selectedGroupId}
              setShowGroupInfo={setShowGroupInfo}
            />
          );
        } else {
          return (
            <UserGroup
              groupId={selectedGroupId}
              onBack={() => setSelectedGroupId(null)}
              setShowGroupInfo={setShowGroupInfo}
            />
          );
        }
      } else {
        return (
          <>
            <Groups onGroupSelect={handleGroupSelect} />
            <UserGroup
              groupId={selectedGroupId}
              onBack={() => setSelectedGroupId(null)}
              setShowGroupInfo={setShowGroupInfo}
            />
            {showGroupInfo && (
              <Box width="30%" borderLeft="1px solid" borderColor="gray.200">
                <GroupInfo
                  groupId={selectedGroupId}
                  setShowGroupInfo={setShowGroupInfo}
                />
              </Box>
            )}
          </>
        );
      }
    } else {
      return <Groups onGroupSelect={handleGroupSelect} />;
    }
  };

  console.log(userPressed, "userpressed");

  return (
    <Center pt={isMobile ? 12 : 20} ml={!isMobile ? "-30" : "auto"} width={isMobile ? "100%" : "100%"} height={isMobile ? "auto" : "calc(100vh - 64px)"} >
      <Stack height={isMobile ? "87vh" : "100%"} width={isMobile ? "100vw" : "75%"} direction={"column"} spacing={0}>
      {!isMobile && (
          <Sidebar
            settings={settings}
            showSettings={showSettings}
            groups={groups}
            showGroups={showGroups}
            calls={calls}
            showCalls={showCalls}
            setUserPressed={setUserPressed}
            requests={requests}
            showRequests={showRequests}
          />
        )}
        {isMobile && !userPressed && (
          <Sidebar
            settings={settings}
            showSettings={showSettings}
            groups={groups}
            showGroups={showGroups}
            calls={calls}
            showCalls={showCalls}
            setUserPressed={setUserPressed}
            requests={requests}
            showRequests={showRequests}
          />
        )}
        <Box flex="1" >
          <Stack
            height={isMobile ? "87vh" : "85vh"}
            width={ isMobile ? "100vw" : "100%" }
            direction={"row"}
            sx={{
              '.css-zlxnoh': {
                position: 'absolute',
                bottom: isMobile ? '-30px' : '-20px'
              }
            }}
          >
            {!settings &&
              !groups &&
              !calls &&
              !requests &&
              isMobile &&
              renderChatsOrUserMessage()}
            {!settings && !groups && !calls && !requests && !isMobile && (
              <>
                <Chats setUserPressed={setUserPressed} userPressed={userPressed} />
                {userPressed && (
                  <UserMessage
                    setUserPressed={setUserPressed}
                    userPressed={userPressed}
                  />
                )}
              </>
            )}
            
            {sidebar.open && userPressed && (() => {
              switch (sidebar.type) {
                case "CONTACT":
                  return <Contact userPressed={userPressed} />;
                case "STARRED":
                  return <StarredMessages />;
                case "SHARED":
                  return <SharedMessages userId={user.id} chatId={userPressed} />;
                default:
                  return null;
              }
            })()}
            {groups && renderGroupsOrUserGroups()}
            {settings && <Settings />}
            {calls && <Call />}
            {requests && <Requests />}
          </Stack>
        </Box>
        
      </Stack>
    </Center>
  );
};

export default MessageMu;