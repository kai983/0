export function buildSummaryPrompt({ title, sourceType, sourceUrl, rawContent }) {
  const sourceLine =
    sourceType === 'url' && sourceUrl
      ? `출처 URL: ${sourceUrl}\n(위 URL의 내용을 바탕으로 작성해줘. 접근할 수 없다면 아래 원문을 사용해줘.)\n`
      : '';

  const content = (rawContent || '').trim();

  return `다음 콘텐츠를 개인 지식 아카이브용으로 재가공해줘.

제목: ${title}
${sourceLine}
[원문/메모]
${content || '(원문 없음 - URL만 참고)'}

아래 형식의 마크다운으로 답변해줘:

## 한 줄 요약
(핵심을 한 문장으로)

## 핵심 내용
- (불릿 3~7개, 구조화된 핵심 포인트)

## 인사이트 / 적용점
- (실제로 활용하거나 더 생각해볼 점)

## 추천 태그
쉼표로 구분된 3~6개의 짧은 태그 (예: 생산성, 마케팅, AI)
`;
}

/** Asks for question and answer pairs in the shape parseCards() reads back. */
export function buildCardsPrompt({ title, summary, rawContent }) {
  const source = (summary || '').trim() || (rawContent || '').trim();

  return `다음 내용으로 복습용 문답 카드를 만들어줘.

제목: ${title}

[내용]
${source || '(내용 없음)'}

규칙:
- 핵심 개념 위주로 3~6개
- 질문은 한 문장, 답은 두 문장 이내
- 내용에 없는 사실은 만들지 말 것
- 아래 형식 그대로만 답할 것 (다른 설명은 붙이지 마)

Q: 질문
A: 답

Q: 질문
A: 답
`;
}
