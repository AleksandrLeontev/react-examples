// React Core
import React from 'react';
import PropTypes from 'prop-types';
// Libs
import get from 'lodash/get';
// Helpers
import { chatMessageDateTime } from '../helpers/ConversationDecorator';


const ConversationChatMessage = props => {
    const { user, message } = props;

    const senderId = get(message, 'sender.id', null);
    const senderName = get(message, 'sender.full_name', null);
    const senderAvatarPath = get(message, 'sender.avatar.medium', null);
    const messageText = get(message, 'body', '');
    const amISender = user.id === senderId;

    return(
        <div
            key={message.id}
            id={`message-${message.id}`}
            className={
                `conversations-chat-message d-flex flex-row
                ${amISender ? 'conversations-chat-current-user-message flex-row-reverse' : ''}`
            }
        >
            <div className={`message-user-avatar-block ${amISender ? 'ml-3' : 'mr-3'}`}>
                <img className='message-user-avatar' src={senderAvatarPath} alt={nickname}/>
            </div>
            <div className='message-body-block  d-flex flex-column'>
                <div
                    className={`d-flex flex-row flex-wrap message-info ${amISender ? 'flex-row-reverse' : ''}`}>
                    <div className={`message-user-name ${amISender ? 'ml-2' : 'mr-2'}`}>
                        { amISender ? 'You' : senderName }
                    </div>
                    <div className='message-date'>{ chatMessageDateTime(message) }</div>
                </div>
                <div className='message-body d-flex'>
                    { messageText }
                </div>
                { amISender &&
                    <div className="ml-auto" style={{ color: message.is_read ? '#0C9696' : '#727272' }}>
                        {`${message.is_read ? 'Seen' : 'Delivered'}`}
                    </div>
                }
            </div>
        </div>
    )
};

ConversationChatMessage.propTypes = {
    user: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
};

ConversationChatMessage.defaultProps = {
    user: {},
    message: {},
};

export default ConversationChatMessage;
