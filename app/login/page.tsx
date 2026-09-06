"use client";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage(){ return <main><div className="container" style={{paddingTop:28}}><Link href="/" className="brand">Crestline <span>Capital</span></Link></div><div style={{minHeight:"80vh",display:"grid",placeItems:"center",padding:24}}><SignIn routing="hash" fallbackRedirectUrl="/dashboard" /></div></main> }
