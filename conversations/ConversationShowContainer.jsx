// React Core
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// Libs
import { get, map, isEmpty, reverse, reduce, includes } from 'lodash';
import InfiniteScroll from 'react-infinite-scroller';
import Modal from 'reactstrap/es/Modal';
import ModalBody from 'reactstrap/es/ModalBody';
import TextareaAutosize from 'react-textarea-autosize';
// ErrorBoundary
import ErrorBoundary from "../errors/ErrorBoundary";
// Components
import ConversationRoomStatus from './ConversationRoomStatus';
import ConversationRoomTopPanel from './ConversationRoomTopPanel';
import ConversationChatMessage from './ConversationChatMessage';
// Modals
import RequestStatusChangeModal from '../modals/conversation/RequestStatusChangeModal';
import ListingApproveModal from '../modals/conversation/ListingApproveModal';
import ChatTermsModal from '../modals/conversation/ChatTermsModal';
// Services
import ConversationApiService from '../../services/api/ConversationApiService';
import { socket } from '../../services/Socket';
// Images
import closeSVG from '../../../src/images/icons/lightbox.svg';
import messageSendSVG from '../../../src/images/icons/message-send.svg';
import infoSVG from '../../../src/images/icons/info.svg';


const ConversationShowContainer = props => {

    const [conversation, setConversation] = useState(props.conversation);
    const [chatMessages, setChatMessages] = useState([]);

    const [isLoadingChatMessages, setChatLoading] = useState(true);
    const [chatInputText, setChatInputText] = useState('');
    const [isStayDetailsOpened, toggleStayDetailsModal] = useState(false);

    let messageInput = null;

    useEffect(() => {
        const channel = `conversation-${props.conversation.id}`;

        messageInput && messageInput.focus();

        socket.subscribe(channel).bind('new-message', (message) => {
            if (props.currentUser.id === message.sender_id) {
                receiveNewMessage(message);
            } else {
                ConversationApiService.markMessageAsRead(props.conversation.id, message.id).then((updatedMessage) => {
                    receiveNewMessage(updatedMessage);
                });
            }
        });

        socket.subscribe(channel).bind('messages-update', (data) => {
            setChatMessages(prevMessages => {
                return reduce(prevMessages, (result, message, key) => {
                    if (includes(data.conversation_messaged_ids, message.id)) message.is_read = true;
                    result.push(message);
                    return result
                }, []);
            });
        });
        return () => socket.unsubscribe(channel)
    }, []);

    const fetchConversation = () => {
        ConversationApiService.fetchConversation(conversation).then((conversation) => {
            setConversation(conversation)
        })
    };

    const receiveNewMessage = (message) => {
        setChatMessages(prevMessages => [message, ...prevMessages]);
    };

    const fetchChatMessages = (page = 0) => {
        ConversationApiService.getMessages(props.conversation.id, page)
            .then((messages) => {
                setChatMessages(prevMessages => [...prevMessages, ...messages]);
                setChatLoading(messages.length === 25)
            })
            .catch((error) => {
                // TODO chat error handle
                setChatLoading(false)
            })
    };

    const changeRoomRequestStatus = (status) => {
        const { conversation: { conversationable_type } } = props;

        if (conversationable_type !== 'Request') throw Error('Only changes status on Request entity');

        const requestId = get(props, 'conversation.conversationable.id', null);

        return ConversationApiService.changeRequestStatus(requestId, status)
    };

    const approveListing = () => {
        return ConversationApiService.approveListing(props.conversation)
    };

    const onRequestedStatusChange = (status) => {
        RequestStatusChangeModal.requestedStatusChange()
            .then((result) => {
                if (result.value) {
                    changeRoomRequestStatus(status)
                        .then(() => {
                            RequestStatusChangeModal.completedStatusChange(fetchConversation)
                        })
                        .catch(() => {
                            RequestStatusChangeModal.failedStatusChange()
                        })
                }
            })
    };

    const onCompleteApproveListing = () => {
        approveListing()
            .then(() => {
                ListingApproveModal.completedListingApprove(fetchConversation);
            })
            .catch(() => {
                ListingApproveModal.failedListingApprove();
            })
    };

    const sendMessage = () => {
        const conversationId = get(props, 'conversation.id', null);

        if (!isEmpty(chatInputText)) {
            setChatInputText('');
            ConversationApiService.sendMessage(conversationId, chatInputText)
        }
    };

    const handleModal = () => {
        toggleStayDetailsModal(!isStayDetailsOpened)
    };

    const handleChatMessageChange = (event) => {
        const chatMessage = get(event, 'target.value', '');
        setChatInputText(chatMessage)
    };

    const handleInfoButtonClick = () => {
        ChatTermsModal.showChatTerms()
    };

    const renderChatMessage = (message) => {
        return (
            <ConversationChatMessage
                key={message.id}
                user={props.currentUser}
                message={message}
            />
        )
    };

    const renderTopPanel = () => {
        return (
            <ConversationRoomTopPanel
                conversation={conversation}
                handleModal={handleModal}
                changeRoomRequestStatus={onRequestedStatusChange}
                approveListing={onCompleteApproveListing}
            />
        )
    };

    const renderChatControlsPanel = () => {
        return (
            <div className='chat-input-container d-flex flex-row align-items-center'>
                <div className='d-flex message-input-block position-relative'>
                    <TextareaAutosize
                        id="conversation-input"
                        maxRows={4}
                        minRows={1}
                        inputRef={(ref) => (messageInput = ref)}
                        placeholder='Type here...'
                        value={chatInputText}
                        onChange={handleChatMessageChange}
                    />
                </div>
                <div className="d-flex flex-row justify-content-center">
                    <img
                        style={{ paddingLeft: '10px', paddingRight: '10px' }}
                        alt="send-message"
                        className="d-flex"
                        src={messageSendSVG}
                        onClick={sendMessage}
                    />
                    <img
                        className="d-flex"
                        src={infoSVG}
                        alt="info"
                        onClick={handleInfoButtonClick}
                    />
                </div>
            </div>
        )
    };

    const { contract } = props;
    const messagesRenderer = map(chatMessages, renderChatMessage);

    return (
        <ErrorBoundary>
            <div className="conversation-wrapper d-flex flex-column w-100 h-100">
                {renderTopPanel()}
                <div className='conversation-chat-container d-flex flex-column'>
                    <InfiniteScroll
                        isReverse={true}
                        pageStart={0}
                        loadMore={fetchChatMessages}
                        hasMore={isLoadingChatMessages}
                        loader={
                            <div
                                className="m-loader m-loader--brand m-loader--lg"
                                style={{ marginTop: 10, marginBottom: 20, height: 20, backgroundColor: 'white' }}
                                key={0}
                            />
                        }
                        useWindow={false}
                    >
                        <div className="messages-container d-flex flex-column">
                            {reverse(messagesRenderer)}
                        </div>
                    </InfiniteScroll>
                </div>
                {renderChatControlsPanel()}
                <Modal
                    className="conversation-wrapper"
                    contentClassName="room-details-modal-wrapper"
                    isOpen={isStayDetailsOpened}
                    modalTransition={{ timeout: 200 }}
                    backdropTransition={{ timeout: 400 }}
                    toggle={handleModal}
                >
                    <ModalBody>
                        <div className="d-flex flex-row align-items-center justify-content-end">
                            <img src={closeSVG} alt="close" onClick={handleModal}/>
                        </div>
                        <div className="request-info-title">
                            Your request
                        </div>
                        <ConversationRoomStatus
                            contract={contract}
                            conversation={conversation}
                            changeRoomRequestStatus={onRequestedStatusChange}
                            approveListing={onCompleteApproveListing}
                        />
                    </ModalBody>
                </Modal>
            </div>
        </ErrorBoundary>
    )

};

ConversationShowContainer.propTypes = {
    currentUser: PropTypes.object.isRequired,
    contract: PropTypes.object,
    conversation: PropTypes.object,
};

ConversationShowContainer.defaultProps = {
    contract: {},
    conversation: {},
};

export default props => <ConversationShowContainer {...props} />;
