import {useParams} from "react-router";
import QRCode from "react-qr-code";

function Invite() {
    let { uuid } = useParams();

    function createInviteUrl() {
        return `${window.location.host}/join/${uuid}`;
    }
    return <>
        <h1>Invite</h1>

        <QRCode
            size={20}
            style={{ height: "auto", maxWidth: "100%", width: "25%" }}
            value={createInviteUrl()}
        />
    </>
}

export default Invite