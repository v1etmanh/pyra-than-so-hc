'use client';

import { FormEvent, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Tag,
  TagLabel,
  Text,
  Textarea,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { MdQuestionAnswer, MdSearch } from 'react-icons/md';
import { MOCK_NUMEROLOGY_INDICATORS } from '@/mocks/numerology-indicators';
import { MOCK_USER_PROFILE_24, type NumerologyProfile24 } from '@/mocks/numerology-profile';

type SearchResult = (typeof MOCK_NUMEROLOGY_INDICATORS)[number] & { score: number };

interface NumerologySearchQAProps {
  profile?: NumerologyProfile24;
}

export function NumerologySearchQA({ profile = MOCK_USER_PROFILE_24 }: NumerologySearchQAProps) {
  const locale = useLocale();
  const isEnglish = locale.toLowerCase().startsWith('en');
  const [query, setQuery] = useState('');
  const [question, setQuestion] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState<'search' | 'qa' | null>(null);
  const [error, setError] = useState('');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('brand.100', 'brand.700');
  const muted = useColorModeValue('gray.600', 'gray.300');
  const answerBg = useColorModeValue('orange.50', 'whiteAlpha.100');

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    if (query.trim().length < 2) return;
    setLoading('search');
    setError('');
    try {
      const response = await fetch(`/api/numerology/search?q=${encodeURIComponent(query)}&limit=6`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Search failed');
      setResults(payload.results ?? []);
      if (!payload.results?.length) setError(isEnglish ? 'No indicator found.' : 'Không tìm thấy chỉ số phù hợp.');
    } catch {
      setError(isEnglish ? 'Search is unavailable.' : 'Không thể tìm kiếm lúc này.');
    } finally {
      setLoading(null);
    }
  };

  const askQuestion = async (event?: FormEvent) => {
    event?.preventDefault();
    if (question.trim().length < 3) return;
    setLoading('qa');
    setError('');
    setAnswer('');
    try {
      const response = await fetch('/api/numerology/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          indicatorKey: selectedKey,
          locale,
          profile,
          mode: 'stream'
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Q&A failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No Q&A response body');
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const payload = JSON.parse(raw);
            if (payload.type === 'sources' || payload.done) continue;
            if (payload.content) {
              accumulated += payload.content;
              setAnswer(accumulated);
            }
          } catch {
            // Ignore provider-specific malformed SSE fragments.
          }
        }
      }
      if (!accumulated) throw new Error('Empty Q&A response');
    } catch {
      setError(isEnglish ? 'Unable to answer this question.' : 'Chưa thể trả lời câu hỏi này.');
    } finally {
      setLoading(null);
    }
  };

  const chooseIndicator = (result: SearchResult) => {
    setSelectedKey(result.key);
    setQuestion(isEnglish
      ? `What does ${result.nameEn} mean?`
      : `Chỉ số ${result.nameVi} có ý nghĩa gì?`);
  };

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: 4, md: 6 }}
      mb={8}
      shadow="sm"
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" align="start" wrap="wrap" gap={2}>
          <Box>
            <HStack spacing={2} mb={1}>
              <MdQuestionAnswer color="#DD6B20" />
              <Text fontWeight={800} fontSize={{ base: 'lg', md: 'xl' }}>
                {isEnglish ? 'Search & ask about your numbers' : 'Tìm kiếm và hỏi về các chỉ số'}
              </Text>
            </HStack>
            <Text fontSize="sm" color={muted}>
              {isEnglish ? 'Try the 24-indicator mock catalog before connecting the real RAG answer layer.' : 'Thử catalog mock 24 chỉ số trước khi nối lớp trả lời RAG thật.'}
            </Text>
          </Box>
          <Badge colorScheme="orange" borderRadius="full" px={3} py={1}>
            MOCK · 24 {isEnglish ? 'indicators' : 'chỉ số'}
          </Badge>
        </HStack>

        <form onSubmit={runSearch}>
          <FormControl>
            <FormLabel fontSize="sm">{isEnglish ? 'Search indicator' : 'Tìm chỉ số'}</FormLabel>
            <HStack>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isEnglish ? 'life path, soul, personal year...' : 'đường đời, linh hồn, năm cá nhân...'}
                aria-label={isEnglish ? 'Search indicator' : 'Tìm chỉ số'}
              />
              <Button type="submit" colorScheme="orange" leftIcon={<MdSearch />} isLoading={loading === 'search'}>
                {isEnglish ? 'Search' : 'Tìm'}
              </Button>
            </HStack>
          </FormControl>
        </form>

        {results.length > 0 && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
            {results.map((result) => (
              <Button
                key={result.key}
                variant={selectedKey === result.key ? 'solid' : 'outline'}
                colorScheme="orange"
                justifyContent="space-between"
                h="auto"
                py={2}
                whiteSpace="normal"
                onClick={() => chooseIndicator(result)}
              >
                <span>{isEnglish ? result.nameEn : result.nameVi}</span>
                <Tag size="sm" ml={2} flexShrink={0}>
                  <TagLabel>{result.mockValue}</TagLabel>
                </Tag>
              </Button>
            ))}
          </SimpleGrid>
        )}

        <form onSubmit={askQuestion}>
          <FormControl>
            <FormLabel fontSize="sm">{isEnglish ? 'Ask a question' : 'Đặt câu hỏi'}</FormLabel>
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={isEnglish ? 'What does my Life Path number say about my strengths?' : 'Đường đời của tôi nói gì về điểm mạnh?'}
              rows={3}
              aria-label={isEnglish ? 'Ask a numerology question' : 'Đặt câu hỏi thần số học'}
            />
            <Button mt={2} type="submit" colorScheme="brand" isLoading={loading === 'qa'} isDisabled={question.trim().length < 3}>
                {isEnglish ? 'Ask with profile context' : 'Hỏi dựa trên hồ sơ'}
            </Button>
          </FormControl>
        </form>

        {loading === 'qa' && <Spinner alignSelf="center" color="brand.400" />}
        {error && <Alert status="warning" borderRadius="lg"><AlertIcon />{error}</Alert>}
        {answer && (
          <Box borderWidth="1px" borderColor="orange.200" borderRadius="xl" p={4} bg={answerBg}>
            <Text fontWeight={700} mb={2}>{isEnglish ? 'Answer' : 'Câu trả lời'}</Text>
            <Text fontSize="sm" lineHeight="tall">{answer}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
