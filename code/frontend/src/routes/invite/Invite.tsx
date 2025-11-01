import { useParams, Link } from "react-router";
import QRCode from "react-qr-code";
import "./Invite.css";

function Invite() {
    const { uuid } = useParams();

    const inviteUrl = `${window.location.origin}/join/${uuid}`;

    return (
        <div className="invite-container">
            <h1>Invite</h1>
            <div className="qr-wrapper">
                <Link to={`/join/${uuid}`}>
                    <QRCode value={inviteUrl} />
                </Link>
            </div>
        </div>
    );
}

export default Invite;
