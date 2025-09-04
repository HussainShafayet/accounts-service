// src/components/GoogleLoginButton.jsx
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import useLoadGoogleScript from "../hooks/useLoadGoogleScript";
import { loginWithGoogleIdToken } from "../features/auth/authThunks";
import { useNavigate } from "react-router-dom";

export default function GoogleLoginButton({ oneTap = true, text = "continue_with" }) {
  const loaded = useLoadGoogleScript();
  const buttonRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { isAuthenticated, loading } = useSelector((s) => s.auth);

  useEffect(() => {
    if (!loaded || !window.google || !clientId || isAuthenticated) return;

    const cb = async (response) => {
      try {
        const credential = response?.credential;
        if (!credential) return;
        const res = await dispatch(loginWithGoogleIdToken(credential)).unwrap();
        if (res?.access) navigate("/dashboard");
      } catch (e) {
        // optional: toast/show error
        console.error("Google login error", e);
      }
    };

    // initialize
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: cb,
      // auto_select: true,  // optional
      ux_mode: "popup",      // popup recommended for SPAs
      itp_support: true,
    });

    // render button
    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text,             // "continue_with" | "signin_with"
        logo_alignment: "left",
      });
    }

    // One Tap (optional)
    if (oneTap) {
      // silently try; handle block by browser
      window.google.accounts.id.prompt((notification) => {
        // notification.isNotDisplayed() / isSkippedMoment() – ignore quietly
        // console.log(notification.getMomentType(), notification.getDismissedReason());
      });
    }

    return () => {
      // cleanup not strictly needed; keep session alive
    };
  }, [loaded, clientId, dispatch, navigate, isAuthenticated, oneTap, text]);

  // GoogleLoginButton.jsx এ
    if (!loaded) {
    return <div className="text-sm text-gray-500 text-center">Google sign-in unavailable.</div>;
    }


  return (
    <div className="w-full">
      {/* Button mount point */}
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
}
