フロントエンドとバックエンドの品質チェックを実行し、問題があれば修正してください。

## チェック対象

| 対象 | ツール | コマンド |
| ---- | ------ | -------- |
| フロントエンド（Next.js / TypeScript） | ESLint | `cd frontend && npm run lint` |
| バックエンド（Spring Boot） | Checkstyle | `cd backend && ./gradlew checkstyleMain checkstyleTest` |

---

## 手順

### Step 1: フロントエンド — ESLint

```bash
cd frontend && npm run lint
```

- エラーが **0件** なら「✅ ESLint: 問題なし」と報告する。
- エラーがある場合は以下を実施する:
  1. エラーの内容（ファイル名・行番号・ルール名）を一覧表示する
  2. 各エラーの原因と修正方法を説明する
  3. コードを修正する
  4. 修正後に再度 `npm run lint` を実行して 0 件になることを確認する

### Step 2: バックエンド — Checkstyle

```bash
cd backend && ./gradlew checkstyleMain checkstyleTest
```

- `BUILD SUCCESSFUL` なら「✅ Checkstyle: 問題なし」と報告する。
- 違反がある場合は以下を実施する:
  1. 違反の内容（ファイル名・行番号・ルール名）を一覧表示する
  2. 各違反の原因と修正方法を説明する
  3. コードを修正する
  4. 修正後に再度 `./gradlew checkstyleMain` を実行して通過を確認する

---

## 結果の報告フォーマット

チェック完了後、以下の形式でまとめて報告する:

```
## 品質チェック結果

### フロントエンド（ESLint）
✅ 0 errors, 0 warnings  ← 問題なしの場合
❌ N errors              ← 問題ありの場合（修正済み or 修正内容を説明）

### バックエンド（Checkstyle）
✅ BUILD SUCCESSFUL      ← 問題なしの場合
❌ N violations          ← 問題ありの場合（修正済み or 修正内容を説明）
```

問題がない場合は「すべてのチェックが通過しています」と伝える。
問題があった場合は修正内容を箇条書きでまとめる。
