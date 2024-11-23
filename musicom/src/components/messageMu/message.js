import { Box, Stack, Text, Highlight } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { ChatHistory } from './buttons';
import {
  DocMsg,
  LinkMsg,
  MediaMsg,
  ReplyMsg,
  TextMsg,
  Timeline,
} from './msgTypes';
import { db, firestore } from 'lib/firebase';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs } from 'firebase/firestore';
import { useAuth } from 'hooks/auth';
import { format } from 'date-fns';
import { useRef } from 'react';

const Message = ({ menu, history, user, searchQuery }) => {
  const [filteredHistory, setFilteredHistory] = useState(history);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [history, searchQuery]);

  return (
    <Box p={3} height={'100%'} overflowY={'scroll'} ref={chatContainerRef}>
      <Stack spacing={3}>
        {history?.map((el) => {
          switch (el.type) {
            case 'divider':
              return <Timeline el={el} />;
            case 'msg':
              switch (el.subtype) {
                case 'img':
                  return <MediaMsg el={el} menu={menu} />;
                case 'doc':
                  return <DocMsg el={el} menu={menu} />;
                case 'link':
                  return <LinkMsg el={el} menu={menu} />;
                case 'reply':
                  return <ReplyMsg el={el} menu={menu} />;
                default:
                  return (
                    <TextMsg
                      el={el}
                      menu={menu}
                      user={user}
                      searchQuery={searchQuery}
                    />
                  );
              }
            case 'text':
              switch (el.subtype) {
                case 'img':
                  return <MediaMsg el={el} menu={menu} />;
                case 'doc':
                  return <DocMsg el={el} menu={menu} />;
                case 'link':
                  return <LinkMsg el={el} menu={menu} />;
                case 'reply':
                  return <ReplyMsg el={el} menu={menu} />;
                default:
                  return (
                    <TextMsg
                      el={el}
                      menu={menu}
                      user={user}
                      searchQuery={searchQuery}
                    />
                  );
                case 'text':
                  return (
                    <>
                      <TextMsg
                        el={el}
                        menu={menu}
                        user={user}
                        searchQuery={searchQuery}
                      />
                      <Text fontSize="xs" color="gray.500">
                        {format(new Date(el.createdAt.seconds * 1000), 'PPpp')}
                      </Text>
                    </>
                  );
              }
              break;
            default:
              return <></>;
          }
        })}
      </Stack>
    </Box>
  );
};

export default Message;
