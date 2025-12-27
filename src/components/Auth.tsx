"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./Auth.module.css";
import { useToast } from "@/lib/toast-context";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "signup">("login");
    const { addToast } = useToast();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                addToast("환영합니다!");
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                addToast("회원가입 성공! 이메일을 확인하거나 로그인해주세요.");
                setMode("login");
            }
        } catch (error: any) {
            addToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>✨</div>
                    <h1 className={styles.title}>내 영어 과외 선생님</h1>
                    <p className={styles.subtitle}>
                        {mode === "login" ? "나만의 학습 공간에 로그인하세요" : "새로운 학습을 시작하세요"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>이메일 주소</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>비밀번호</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    <button type="submit" disabled={loading} className={styles.button}>
                        {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
                        <button
                            onClick={() => setMode(mode === "login" ? "signup" : "login")}
                            className={styles.linkButton}
                        >
                            {mode === "login" ? "회원가입" : "로그인"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
