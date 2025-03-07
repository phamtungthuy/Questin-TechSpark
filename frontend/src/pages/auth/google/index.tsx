import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import queryString from "query-string";
import "./index.css";
import { useLoginWithGoogle } from "hooks/auth-hook";

const { REACT_APP_GOOGLE_REDIRECT_URL_ENDPOINT } =
    process.env;
const SocialAuth = () => {
  const { googleLogin } = useLoginWithGoogle();
  let location = useLocation();

  useEffect(() => {
    const values = queryString.parse(location.search);
    const code = values.code;

    if (code && typeof code === "string") {
      googleLogin({
        code: code,
        redirect_uri: `${REACT_APP_GOOGLE_REDIRECT_URL_ENDPOINT}/google`
      });
    }
  }, []);


  return (
    <div className="loading-icon-container">
      <div className="loading-icon">
        <div className="loading-icon__circle loading-icon__circle--first"></div>
        <div className="loading-icon__circle loading-icon__circle--second"></div>
        <div className="loading-icon__circle loading-icon__circle--third"></div>
        <div className="loading-icon__circle loading-icon__circle--fourth"></div>
      </div>
        <small className=" text-center mr-2">
          Just a moment
        </small>
    </div>
  );
};


export default SocialAuth;
