'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Badge,
  Progress,
  SimpleGrid,
  useColorModeValue
} from '@/components';
import {
  MINI_IPIP_QUESTIONS,
  TRAIT_DETAILS,
  PersonalityProfile,
  PersonalityTrait
} from '@/utils/personalityTypes';
import { useLocale } from 'next-intl';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (answers: Record<number, number>) => PersonalityProfile;
  initialProfile?: PersonalityProfile | null;
}

export function PersonalityAssessmentModal({
  isOpen,
  onClose,
  onSaveProfile,
  initialProfile
}: Props) {
  const locale = useLocale();
  const isVi = locale === 'vi';

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(Boolean(initialProfile?.scores));
  const [completedProfile, setCompletedProfile] = useState<PersonalityProfile | null>(
    initialProfile || null
  );

  const bgModal = useColorModeValue('white', 'gray.900');
  const bgCard = useColorModeValue('gray.50', 'whiteAlpha.100');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const primaryColor = useColorModeValue('orange.500', 'orange.300');
  const directiveBg = useColorModeValue('orange.50', 'whiteAlpha.50');
  const directiveBorder = useColorModeValue('orange.200', 'orange.800');
  const directiveTextColor = useColorModeValue('gray.700', 'gray.300');

  const currentQ = MINI_IPIP_QUESTIONS[currentIndex];
  const traitInfo = currentQ ? TRAIT_DETAILS[currentQ.trait] : null;

  const handleSelectOption = useCallback(
    (rating: number) => {
      const nextAnswers = { ...answers, [currentQ.id]: rating };
      setAnswers(nextAnswers);

      if (currentIndex < MINI_IPIP_QUESTIONS.length - 1) {
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 150);
      } else {
        // Complete survey
        const profile = onSaveProfile(nextAnswers);
        setCompletedProfile(profile);
        setIsCompleted(true);
      }
    },
    [answers, currentQ, currentIndex, onSaveProfile]
  );

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setCompletedProfile(null);
  }, []);

  const progressPercent = useMemo(() => {
    return Math.round(((currentIndex + 1) / MINI_IPIP_QUESTIONS.length) * 100);
  }, [currentIndex]);

  const LIKERT_OPTIONS = [
    { val: 1, label: isVi ? 'Hoàn toàn không đúng' : 'Strongly Disagree' },
    { val: 2, label: isVi ? 'Khá không đúng' : 'Disagree' },
    { val: 3, label: isVi ? 'Trung lập / Phân vân' : 'Neutral' },
    { val: 4, label: isVi ? 'Khá đúng' : 'Agree' },
    { val: 5, label: isVi ? 'Hoàn toàn đúng' : 'Strongly Agree' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(6px)" />
      <ModalContent bg={bgModal} borderRadius="2xl" mx={4} overflow="hidden" boxShadow="2xl">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={4}>
          <HStack justify="space-between" pr={6}>
            <HStack spacing={2}>
              <Text fontSize="xl">🌸</Text>
              <Heading fontSize={{ base: 'md', md: 'lg' }}>
                {isVi ? 'Khảo Sát Tính Cách Big Five (Mini-IPIP 20)' : 'Big Five Personality Assessment'}
              </Heading>
            </HStack>
            {isCompleted && (
              <Badge colorScheme="green" variant="subtle" borderRadius="full" px={3}>
                {isVi ? 'Đã hoàn thành' : 'Completed'}
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton mt={1} />

        <ModalBody p={{ base: 4, md: 6 }}>
          {!isCompleted ? (
            <VStack spacing={6} align="stretch">
              {/* Progress & Trait Tag */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Badge colorScheme="orange" variant="outline" borderRadius="full" px={3} py={0.5} fontSize="xs">
                    {traitInfo?.label}
                  </Badge>
                  <Text fontSize="xs" color="gray.500" fontWeight={600}>
                    {isVi ? `Câu ${currentIndex + 1} / ${MINI_IPIP_QUESTIONS.length}` : `Question ${currentIndex + 1} / ${MINI_IPIP_QUESTIONS.length}`}
                  </Text>
                </HStack>
                <Progress value={progressPercent} size="xs" colorScheme="orange" borderRadius="full" />
              </Box>

              {/* Question Text */}
              <Box py={8} px={4} textAlign="center" minH="120px" display="flex" alignItems="center" justifyContent="center" bg={bgCard} borderRadius="xl">
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight={700} lineHeight="tall">
                  "{isVi ? currentQ?.text : currentQ?.textEn}"
                </Text>
              </Box>

              {/* 5-Point Scale Grid */}
              <SimpleGrid columns={{ base: 1, sm: 5 }} spacing={3}>
                {LIKERT_OPTIONS.map((opt) => {
                  const isSelected = currentQ && answers[currentQ.id] === opt.val;
                  return (
                    <Button
                      key={opt.val}
                      onClick={() => handleSelectOption(opt.val)}
                      variant={isSelected ? 'solid' : 'outline'}
                      colorScheme={isSelected ? 'orange' : 'gray'}
                      h="auto"
                      py={4}
                      px={2}
                      borderRadius="xl"
                      display="flex"
                      flexDirection={{ base: 'row', sm: 'column' }}
                      justifyContent="center"
                      alignItems="center"
                      gap={2}
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                    >
                      <Text fontSize="xl" fontWeight={800}>
                        {opt.val}
                      </Text>
                      <Text fontSize="2xs" textAlign="center" whiteSpace="normal">
                        {opt.label}
                      </Text>
                    </Button>
                  );
                })}
              </SimpleGrid>

              {/* Prev Button */}
              <HStack justify="space-between" pt={4} borderTopWidth="1px" borderColor={borderColor}>
                <Button size="sm" variant="ghost" onClick={handlePrev} isDisabled={currentIndex === 0}>
                  {isVi ? '← Câu trước' : '← Previous'}
                </Button>
                <Text fontSize="xs" color="gray.400" fontStyle="italic">
                  {isVi ? 'Chọn 1 trong 5 mức độ để tự động sang câu kế tiếp' : 'Select a rating to advance'}
                </Text>
              </HStack>
            </VStack>
          ) : (
            /* Results View */
            <VStack spacing={6} align="stretch">
              <Box textAlign="center" py={2}>
                <Heading fontSize="xl" color={primaryColor} mb={2}>
                  {isVi ? '✨ Bản Đồ Năng Lượng Tính Cách Của Bạn' : '✨ Your Personality Profile'}
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  {completedProfile?.communicationStyle}
                </Text>
              </Box>

              {/* 5 Trait Score Bars */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {completedProfile &&
                  (Object.keys(completedProfile.scores) as PersonalityTrait[]).map((traitKey) => {
                    const score = completedProfile.scores[traitKey];
                    const info = TRAIT_DETAILS[traitKey];
                    return (
                      <Box key={traitKey} p={4} borderRadius="xl" bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight={700} fontSize="sm">
                            {info.label}
                          </Text>
                          <Badge colorScheme={score >= 60 ? 'green' : score <= 40 ? 'purple' : 'blue'} borderRadius="full" px={2}>
                            {score}%
                          </Badge>
                        </HStack>
                        <Progress value={score} size="sm" borderRadius="full" colorScheme={score >= 60 ? 'green' : score <= 40 ? 'purple' : 'blue'} mb={2} />
                        <Text fontSize="xs" color="gray.500">
                          {score >= 50 ? info.highDesc : info.lowDesc}
                        </Text>
                      </Box>
                    );
                  })}
              </SimpleGrid>

              {/* Tone Directive Summary */}
              <Box p={4} borderRadius="xl" bg={directiveBg} borderWidth="1px" borderColor={directiveBorder}>
                <HStack align="start" spacing={3}>
                  <Text fontSize="xl">💡</Text>
                  <Box>
                    <Text fontWeight={700} fontSize="sm" color={primaryColor} mb={1}>
                      {isVi ? 'Cơ Chế Cá Nhân Hóa Văn Phong Khi Tra Cứu Thần Số Học:' : 'Personalized Interpretation Directive:'}
                    </Text>
                    <Text fontSize="xs" color={directiveTextColor} lineHeight="tall">
                      {completedProfile?.toneDirective}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* Actions */}
              <HStack justify="flex-end" spacing={3} pt={2}>
                <Button size="sm" variant="outline" onClick={handleRestart}>
                  {isVi ? '🔄 Làm Lại Khảo Sát' : '🔄 Retake Survey'}
                </Button>
                <Button size="sm" colorScheme="orange" onClick={onClose} px={6}>
                  {isVi ? 'Bắt Đầu Tra Cứu 24 Chỉ Số ➔' : 'Proceed to Lookups ➔'}
                </Button>
              </HStack>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
