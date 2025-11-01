import {validateSession} from "../../service/fetchService";
import {useNavigate, useParams} from "react-router";
import {Navigation} from "../Navigation";
import {useEffect} from "react";

function Join() {
    let {uuid} = useParams();
    let navigate = useNavigate();

    useEffect(() => {
        validateSession().then(() => navigate(`${Navigation.POLL}/${uuid}`)).catch(() => {
            navigate(`${Navigation.LOGIN}/${uuid}`)
        })
    }, [uuid, navigate]);
    return <>
    </>
}

export default Join