// React Core
import React from 'react';
import PropTypes from 'prop-types';
// Components
import Button from '../buttons/ButtonDefault';
import ConversationRoomRequestStatusControls from './ConversationRoomRequestStatusControls';
// Images
import closeSVG from '../../../src/images/icons/lightbox.svg';


const ConversationRoomTopPanel = props => {
    const { conversation, handleModal, changeRoomRequestStatus, approveListing } = props;

    return (
        <div className="top-panel-container d-flex flex-row align-items-center">
            <ConversationRoomRequestStatusControls
                conversation={conversation}
                onRequestedStatusChange={changeRoomRequestStatus}
                onCompleteApproveListing={approveListing}
                allowRequestCancel={false}
            />
            <Button
                title="Show Details"
                type="secondary"
                customClasses="request-control-button"
                onClick={handleModal}
            />
            <div className='back-link' style={{ marginLeft: 10 }}>
                <a href={Routes.v2_conversations_path()}>
                    <img src={closeSVG} alt='close'/>
                </a>
            </div>
        </div>
    )
};

ConversationRoomTopPanel.propTypes = {
    conversation: PropTypes.object,
    changeRoomRequestStatus: PropTypes.func,
    approveListing: PropTypes.func,
};

ConversationRoomTopPanel.defaultProps = {
    conversation: {},
    changeRoomRequestStatus: () => {
    },
    approveListing: () => {
    },
};

export default ConversationRoomTopPanel;
