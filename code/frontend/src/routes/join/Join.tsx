import {validateSession} from "../../service/fetchService";
import {useNavigate, useParams} from "react-router";
import {Navigation} from "../Navigation";

function Join() {
    let {uuid} = useParams();
    let navigate = useNavigate();

    validateSession().then(() => navigate(`${Navigation.POLL}/${uuid}`)).catch(() => {
        navigate(`${Navigation.LOGIN}/${uuid}`)
    })
    return <>
    </>
}

export default Join