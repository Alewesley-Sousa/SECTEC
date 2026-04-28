import { Button } from "./Button";

type GoogleLoginButtonProps = {
  onClick: () => void;
  isLoading?: boolean;
};
 
function GoogleLoginButton({onClick, isLoading = false}: GoogleLoginButtonProps) {
    return(
        <Button
        type="button"
        size="lg"
        variant="primary"
        onClick={onClick}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base"
        >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white font-bold text-sectec-700">
                G
            </span>
            Entrar com Google
        </Button>
    );
}
export default GoogleLoginButton;