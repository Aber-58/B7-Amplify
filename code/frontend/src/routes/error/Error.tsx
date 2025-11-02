import { useNavigate } from 'react-router';
import { Navigation } from '../Navigation';

function Error() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-lg shadow-card p-8 border border-ink/10 text-center">
                <h1 className="text-4xl font-display font-bold text-neg mb-4">Oops!</h1>
                <p className="text-lg text-ink/70 font-display mb-6">
                    Something went wrong. Please try again later.
                </p>
                <button
                    onClick={() => navigate(Navigation.ADMIN)}
                    className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-display font-medium"
                >
                    Go to Admin
                </button>
            </div>
        </div>
    );
}

export default Error;