import { useParams } from "react-router";
import QRCode from "react-qr-code";
import "./Invite.css";

function Invite() {
    const { uuid } = useParams();

    function createInviteUrl() {
        return `${window.location.host}/join/${uuid}`;
    }

    return (
        <div className="invite-container">
            <h1>Invite</h1>
            <div className="qr-wrapper">
                <QRCode value={createInviteUrl()} />
            </div>
        </div>
    );
}

export default Invite;
