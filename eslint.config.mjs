import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  {
    rules: {
      // ── กฎที่เป็นคำแนะนำ ไม่ใช่ความถูกต้อง → ตั้งเป็นคำเตือน ──
      //
      // กลุ่ม react-hooks ด้านล่างมาจาก React Compiler ซึ่งชี้จุดที่เขียนได้ดีกว่า
      // (ลด render ซ้ำ, เลี่ยงการแก้ค่าใน state ตรงๆ) แต่โค้ดปัจจุบันยังทำงานถูกต้อง
      // ตั้งเป็นคำเตือนไว้ก่อน เพื่อให้ CI จับ "ของที่พังจริง" ได้ชัด แล้วค่อยทยอยแก้
      //
      // no-explicit-any เป็นหนี้ทางเทคนิคที่ยกมาจากโปรเจกต้นทาง
      // จุดสำคัญ (ชั้น API, การเข้าถึงฐานข้อมูล, session) ใส่ type ครบแล้ว
      // ที่เหลือส่วนใหญ่อยู่ในตัวสร้างเอกสาร PDF และฟอร์มฝั่งหน้าเว็บ
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/error-boundaries": "warn",
      "@typescript-eslint/no-explicit-any": "warn",

      // ── กฎที่ยังต้องเป็นข้อผิดพลาด ──
      // เรียก hook แบบมีเงื่อนไขทำให้ลำดับ hook เพี้ยน แอปพังจริง
      "react-hooks/rules-of-hooks": "error",
    },
  },
])

export default eslintConfig
