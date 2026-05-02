import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <div style={styles.root}>
            <Sidebar />
            <div style={styles.main}>
                <Header />
                <main style={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

const styles = {
    root: {
        display: "flex",
        height: "100vh",
        overflow: "hidden",
    },
    main: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    content: {
        flex: 1,
        overflow: "auto",
        padding: "24px",
    },
};