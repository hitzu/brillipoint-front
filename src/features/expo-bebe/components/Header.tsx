import styles from "@assets/css/expo-bebe.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>Brillipoint</div>
      <div className={styles.brandSub}>EXPO</div>
    </header>
  );
}
