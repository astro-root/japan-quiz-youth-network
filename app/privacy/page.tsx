export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">Privacy Policy</p>
      <h1 className="page-title mb-6">プライバシーポリシー</h1>
      <div className="card space-y-5 text-sm leading-relaxed text-ink/70">
        <p>
          全国中高クイズ連盟（以下「当連盟」）は、当連盟が運営するウェブサイト・プラットフォーム（以下「本サービス」）における
          利用者の個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
        </p>

        <h2 className="font-display font-bold text-navy">第1条（取得する情報）</h2>
        <p>当連盟は、本サービスの提供にあたり、利用者から以下の情報を取得します。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>氏名、氏名のふりがな、ハンドルネーム</li>
          <li>生年月日、性別</li>
          <li>所属する学校名、学年、部内での役職（部長・副部長・顧問等）</li>
          <li>メールアドレス、認証情報</li>
          <li>大会参加履歴、団体への所属履歴</li>
          <li>お問い合わせフォームに入力された内容</li>
        </ul>
        <p>
          本サービスの主な利用者には未成年者が含まれることを踏まえ、当連盟は特に生年月日・性別等の情報について、
          利用目的の達成に必要な範囲を超えて取得・利用しません。
        </p>

        <h2 className="font-display font-bold text-navy">第2条（利用目的）</h2>
        <p>取得した情報は、以下の目的で利用します。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>会員登録の管理、本人確認</li>
          <li>大会の運営、参加者の管理、成績・参加履歴の記録</li>
          <li>加盟団体の管理、年会費に関する請求・入金管理</li>
          <li>連盟からのお知らせ・連絡事項の送付</li>
          <li>統計情報（会員数、加盟団体数、男女比等）の作成・公表（個人が特定されない形式に限る）</li>
          <li>お問い合わせへの対応</li>
        </ul>

        <h2 className="font-display font-bold text-navy">第3条（公開される情報の範囲）</h2>
        <p>
          ハンドルネームおよび役職（連盟長・管理者・スタッフ等）は、運営体制の透明性確保のため、本サービス上で公開されることがあります。
          本名、生年月日、連絡先等の情報は、利用者本人の同意がある場合または法令に基づく場合を除き、公開しません。
        </p>

        <h2 className="font-display font-bold text-navy">第4条（第三者提供）</h2>
        <p>
          当連盟は、次のいずれかに該当する場合を除き、あらかじめ本人の同意を得ることなく、第三者に個人情報を提供しません。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>法令に基づく場合</li>
          <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
        </ul>

        <h2 className="font-display font-bold text-navy">第5条（外部サービスの利用）</h2>
        <p>
          本サービスは、データベース・認証基盤としてSupabase、ホスティングとしてVercelを利用しています。
          これらの外部サービスの利用に伴い、情報が国外のサーバーに保存される場合があります。
        </p>

        <h2 className="font-display font-bold text-navy">第6条（保有期間・削除）</h2>
        <p>
          利用者は、マイページからいつでも自身のアカウントを削除できます。アカウント削除後、
          ログイン情報および個人を特定する情報は速やかに削除されますが、大会結果・所属履歴等の記録は、
          統括団体としての記録保存の目的上、個人との紐付けを解除したうえで保持される場合があります。
        </p>

        <h2 className="font-display font-bold text-navy">第7条（未成年者の情報について）</h2>
        <p>
          未成年の利用者が登録する場合、保護者の方は登録内容について本人と十分にご確認ください。
          保護者から開示・訂正・削除等のご要望があった場合は、お問い合わせフォームよりご連絡ください。
        </p>

        <h2 className="font-display font-bold text-navy">第8条（開示・訂正・削除の請求）</h2>
        <p>
          利用者は、当連盟が保有する自己の個人情報について、開示・訂正・削除を求めることができます。
          お問い合わせフォームよりご連絡ください。合理的な期間内に対応いたします。
        </p>

        <h2 className="font-display font-bold text-navy">第9条（本ポリシーの変更）</h2>
        <p>
          当連盟は、必要に応じて本ポリシーの内容を変更することがあります。重要な変更を行う場合は、本サービス上でお知らせします。
        </p>

        <h2 className="font-display font-bold text-navy">第10条（お問い合わせ窓口）</h2>
        <p>個人情報の取り扱いに関するお問い合わせは、お問い合わせフォームよりご連絡ください。</p>

        <p className="text-xs text-ink/40">制定日: 2026年8月30日</p>
      </div>
    </main>
  )
}
