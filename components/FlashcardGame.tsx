"use client";

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Plus, Trophy, XCircle, CheckCircle, Brain, Book, RotateCcw} from 'lucide-react';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {motion, AnimatePresence} from 'framer-motion';


// Types
interface WordStats {
    correctEnToFr: number;
    totalEnToFr: number;
    correctFrToEn: number;
    totalFrToEn: number;
}

interface Word {
    consecutiveSuccess: number | 0;
    en: string;
    fr: string;
    stats: WordStats;
    interval: number;
    easeFactor: number;
    repetitions: number;
    lastReviewed: number | null;  // Modifier ici
    nextReview: number | null;    // Modifier ici
}

interface Message {
    type: 'success' | 'error';
    text: string;
}


// Liste des mots initiale reste la même
const initialWords: Word[] = [
];



// Constants
const MASTERY_THRESHOLD = 10;
const MASTERY_RATIO = 0.85;
const INITIAL_EASE_FACTOR = 2.5;


// Utility functions
const calculateProgress = (word: Word): number => {
    const totalAttempts = word.stats.totalEnToFr + word.stats.totalFrToEn;
    if (totalAttempts === 0) return 0;

    const totalCorrect = word.stats.correctEnToFr + word.stats.correctFrToEn;

    // Calcul du taux de réussite global
    const successRate = totalCorrect / totalAttempts;

    // Pénalité pour les erreurs
    const errorPenalty = (totalAttempts - totalCorrect) * 0.1; // 10% de pénalité par erreur

    // Pourcentage de base
    let progress = (successRate * 100) - (errorPenalty * 100);

    // S'assurer que le pourcentage ne descend pas en dessous de 0
    progress = Math.max(0, progress);

    return Math.min(progress, 100);
};


const checkMastery = (word: Word): boolean => {
    const totalAttempts = word.stats.totalEnToFr + word.stats.totalFrToEn;
    const totalCorrect = word.stats.correctEnToFr + word.stats.correctFrToEn;

    // Vérifier le taux de réussite minimum (80%)
    const successRate = totalCorrect / totalAttempts;
    const hasMinimumSuccessRate = successRate >= MASTERY_RATIO; // 0.8 ou 80%

    // Vérifier si le mot a été trouvé au moins 10 fois
    const hasMinimumAttempts = totalAttempts >= MASTERY_THRESHOLD; // 10 fois

    // Vérifier la séquence de réussites consécutives
    const hasConsecutiveSuccess = word.consecutiveSuccess >= 5; // Par exemple, 5 fois de suite

    return hasMinimumSuccessRate && hasMinimumAttempts && hasConsecutiveSuccess;
};


// Main Component
const FlashcardGame: React.FC = () => {
    // State
    const [words, setWords] = useState<Word[]>([]);
    const [currentCard, setCurrentCard] = useState<Word | null>(null);
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [direction, setDirection] = useState<'en-fr' | 'fr-en'>('en-fr');
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [newWordEn, setNewWordEn] = useState<string>('');
    const [newWordFr, setNewWordFr] = useState<string>('');
    const [message, setMessage] = useState<Message | null>(null);
    const [animation, setAnimation] = useState<string>('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [lastCard, setLastCard] = useState<Word | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false); // État pour gérer la transition


    // Memoized stats calculation
    const stats = useMemo(() => {
        return words.reduce((acc, word) => {
            const isMastered = checkMastery(word);
            const progress = calculateProgress(word);
            return {
                mastered: acc.mastered + (isMastered ? 1 : 0),
                learning: acc.learning + (isMastered ? 0 : 1),
                totalProgress: acc.totalProgress + progress,
                averageProgress: 0
            };
        }, {mastered: 0, learning: 0, totalProgress: 0, averageProgress: 0});
    }, [words]);

    // Fonction de sauvegarde simplifiée
    const saveToLocalStorage = (wordsToSave: Word[]) => {
        localStorage.setItem('flashcard-words', JSON.stringify(wordsToSave));
    };


    // Enhanced word selection system
    const selectNextCard = useCallback(() => {
        if (words.length === 0) {
            setCurrentCard(null);
            return;
        }

        // Vérifier s'il reste des mots non maîtrisés
        const nonMasteredWords = words.filter(word => !checkMastery(word));

        if (nonMasteredWords.length === 0) {
            setCurrentCard(null);
            return;
        }

        const nextWord = selectNextWord(words);

        if (nextWord) {
            // Déterminer la direction d'apprentissage basée sur les performances
            const enToFrRatio = nextWord.stats.correctEnToFr / (nextWord.stats.totalEnToFr || 1);
            const frToEnRatio = nextWord.stats.correctFrToEn / (nextWord.stats.totalFrToEn || 1);

            // Choisir la direction où l'utilisateur a le plus de difficultés
            const newDirection = enToFrRatio < frToEnRatio ? 'en-fr' : 'fr-en';

            // Ajouter un peu d'aléatoire pour ne pas toujours avoir la même direction
            const shouldRandomizeDirection = Math.random() < 0.2; // 20% de chance

            setDirection(shouldRandomizeDirection ? (Math.random() > 0.5 ? 'en-fr' : 'fr-en') : newDirection);
            setCurrentCard(nextWord);
            setLastCard(nextWord);
            setIsFlipped(false);
        }
    }, [words, lastCard]);


    // Modifie la fonction handleResponse
    const handleResponse = useCallback((correct: boolean) => {
        if (!currentCard || isTransitioning) return;

        setAnimation(correct ? 'success' : 'error');
        setIsTransitioning(true);

        const updatedWords = words.map(word => {
            if (word === currentCard) {
                const updatedStats = {...word.stats};

                if (direction === 'en-fr') {
                    updatedStats.totalEnToFr += 1;
                    if (correct) updatedStats.correctEnToFr += 1;
                } else {
                    updatedStats.totalFrToEn += 1;
                    if (correct) updatedStats.correctFrToEn += 1;
                }

                // Mise à jour des réussites consécutives
                const consecutiveSuccess = correct ?
                    (word.consecutiveSuccess || 0) + 1 : 0;

                return {
                    ...word,
                    stats: updatedStats,
                    consecutiveSuccess,
                    lastReviewed: Date.now()
                };
            }
            return word;
        });

        setWords(updatedWords);
        saveToLocalStorage(updatedWords);

        // Préparer la prochaine carte
        const next = selectNextWord(updatedWords);

        // Nouvelle séquence d'animation
        setTimeout(() => {
            setAnimation('');
            // Retourner la carte face cachée d'abord
            setIsFlipped(false);

            // Attendre que la carte soit face cachée
            setTimeout(() => {
                // Changer le contenu
                setCurrentCard(next);
                setIsTransitioning(false);
            }, 300); // Moitié du temps de l'animation de retournement
        }, 1000);
    }, [currentCard, direction, words, isTransitioning]);

    const selectNextWord = (currentWords: Word[]): Word | null => {
        if (currentWords.length === 0) return null;

        const now = Date.now();
        const availableWords = currentWords.filter(word => !checkMastery(word));

        if (availableWords.length === 0) return null;

        // Calculer les poids pour chaque mot
        const weightedWords = availableWords.map(word => {
            let weight = 1;

            // Poids basé sur le taux de réussite (plus d'importance aux mots moins maîtrisés)
            const successRate = (word.stats.correctEnToFr + word.stats.correctFrToEn) /
                (word.stats.totalEnToFr + word.stats.totalFrToEn || 1);
            weight += (1 - successRate) * 2;

            // Poids basé sur la fréquence d'apparition récente
            if (word.lastReviewed) {
                const timeSinceLastReview = now - word.lastReviewed;
                const hoursElapsed = timeSinceLastReview / (1000 * 60 * 60);

                // Augmenter le poids si le mot n'a pas été vu depuis longtemps
                if (hoursElapsed > 24) {
                    weight += Math.min(hoursElapsed / 24, 3); // Maximum +3 après 3 jours
                }
            } else {
                // Donner une priorité aux mots jamais vus
                weight += 2;
            }

            // Réduire fortement le poids des mots récemment vus
            if (word === lastCard) {
                weight *= 0.1; // Réduire de 90% la chance de revoir le dernier mot
            }

            // Réduire le poids des mots vus dans les 5 derniers tours
            const recentlyViewed = word.lastReviewed &&
                (now - word.lastReviewed) < (1000 * 60 * 5); // 5 minutes
            if (recentlyViewed) {
                weight *= 0.3; // Réduire de 70% la chance
            }

            return {word, weight};
        });

        // Calculer le poids total
        const totalWeight = weightedWords.reduce((sum, item) => sum + item.weight, 0);

        // Sélection pondérée aléatoire
        let random = Math.random() * totalWeight;

        for (const item of weightedWords) {
            random -= item.weight;
            if (random <= 0) {
                return item.word;
            }
        }

        return weightedWords[0].word;
    };

    // Enhanced word addition system
    const addNewWord = useCallback(() => {
        try {
            const trimmedEn = newWordEn.trim();
            const trimmedFr = newWordFr.trim();

            if (!trimmedEn || !trimmedFr) {
                throw new Error("Les deux champs sont requis");
            }

            // Check for duplicates
            if (words.some(w =>
                w.en.toLowerCase() === trimmedEn.toLowerCase() ||
                w.fr.toLowerCase() === trimmedFr.toLowerCase()
            )) {
                throw new Error("Ce mot existe déjà");
            }

            const newWord: Word = {
                consecutiveSuccess: 0,
                en: trimmedEn,
                fr: trimmedFr,
                stats: {correctEnToFr: 0, totalEnToFr: 0, correctFrToEn: 0, totalFrToEn: 0},
                interval: 1,
                easeFactor: INITIAL_EASE_FACTOR,
                repetitions: 0,
                lastReviewed: null,
                nextReview: null
            };

            const updatedWords = [...words, newWord];
            setWords(updatedWords);
            saveToLocalStorage(updatedWords);

            setNewWordEn('');
            setNewWordFr('');
            setShowAddForm(false);
            setMessage({
                type: 'success',
                text: 'Nouveau mot ajouté avec succès !'
            });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.message
            });

            // Clear error message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        }
    }, [newWordEn, newWordFr, words, saveToLocalStorage]);

    const hasRemainingWords = useCallback(() => {
        return words.some(word => !checkMastery(word));
    }, [words]);

    // Initialisation
    useEffect(() => {
        const storedWords = localStorage.getItem('flashcard-words');
        if (storedWords) {
            setWords(JSON.parse(storedWords));
        } else {
            setWords(initialWords);
            saveToLocalStorage(initialWords);
        }
        setIsInitialized(true);
    }, []);

    // Sélection de la première carte
    useEffect(() => {
        if (isInitialized && !currentCard) {
            selectNextCard();
        }
    }, [isInitialized, currentCard, selectNextCard]);

    // Auto-save effect
    useEffect(() => {
        if (!isInitialized) return;
        saveToLocalStorage(words);
    }, [words, isInitialized, saveToLocalStorage]);


    // UI Components
    const renderHeader = () => (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
                Flash<span className="text-purple-600">Cards</span>
            </h1>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-4">
                    <motion.div
                        whileHover={{scale: 1.05}}
                        className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl shadow-lg"
                    >
                        <Trophy className="text-white" size={24}/>
                        <div>
                            <p className="text-white text-sm">Mots maîtrisés</p>
                            <p className="text-white font-bold text-2xl">{stats.mastered}</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{scale: 1.05}}
                        className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg"
                    >
                        <Brain className="text-white" size={24}/>
                        <div>
                            <p className="text-white text-sm">En apprentissage</p>
                            <p className="text-white font-bold text-2xl">{stats.learning}</p>
                        </div>
                    </motion.div>
                </div>

                <motion.button
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                    <Plus size={20}/>
                    <span>Nouveau mot</span>
                </motion.button>
            </div>
        </div>
    );

    const renderAddWordForm = () => (
        <AnimatePresence>
            {showAddForm && (
                <motion.div
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -20}}
                    className="mb-8"
                >
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ajouter un nouveau mot</h2>
                        <div className="space-y-4">
                            <Input
                                placeholder="Mot en anglais"
                                value={newWordEn}
                                onChange={(e) => setNewWordEn(e.target.value)}
                                className="border-2 border-purple-200 focus:border-purple-500 rounded-lg"
                            />
                            <Input
                                placeholder="Mot en français"
                                value={newWordFr}
                                onChange={(e) => setNewWordFr(e.target.value)}
                                className="border-2 border-purple-200 focus:border-purple-500 rounded-lg"
                            />
                            <div className="flex gap-4">
                                <Button
                                    onClick={addNewWord}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    Ajouter
                                </Button>
                                <Button
                                    onClick={() => setShowAddForm(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Annuler
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const renderMessage = () => (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -20}}
                    className="mb-8"
                >
                    <Alert
                        className={`${
                            message.type === 'success' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'
                        } shadow-md`}
                    >
                        <AlertDescription
                            className={`${
                                message.type === 'success' ? 'text-green-800' : 'text-red-800'
                            } font-medium`}
                        >
                            {message.text}
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const handleCardClick = useCallback(() => {
        if (isTransitioning || isFlipped) return;
        setIsFlipped(true);
    }, [isTransitioning, isFlipped]);

    const renderFlashcard = () => {
        if (!currentCard) {
            if (!hasRemainingWords()) {
                return renderCompletionState();
            }
            return null; // ou un état de chargement
        }

        return (
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                className="w-full"
            >
                <div className="relative" style={{perspective: 1000}}>
                    <motion.div
                        onClick={handleCardClick}
                        animate={{
                            rotateY: isFlipped ? 180 : 0,
                            scale: animation ? 1.05 : 1,
                        }}
                        transition={{duration: 0.6}}
                        className={`w-full h-96 cursor-pointer ${
                            animation === 'success' ? 'ring-4 ring-green-400' : ''
                        } ${animation === 'error' ? 'ring-4 ring-red-400' : ''}`}
                        style={{
                            transformStyle: 'preserve-3d',
                            position: 'relative',
                        }}
                    >
                        {/* Front of card */}
                        <div
                            className="absolute w-full h-full"
                            style={{
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                            }}
                        >
                            <Card className="w-full h-full">
                                <div
                                    className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-purple-50 rounded-xl">
                                    <div className="text-4xl font-bold text-gray-800 mb-6">
                                        {direction === 'en-fr' ? currentCard.en : currentCard.fr}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <RotateCcw size={16}/>
                                        <span>Cliquez pour retourner</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Back of card */}
                        <div
                            className="absolute w-full h-full"
                            style={{
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                            }}
                        >
                            <Card className="w-full h-full">
                                <div
                                    className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-blue-50 rounded-xl">
                                    <div className="text-4xl font-bold text-gray-800 mb-6">
                                        {direction === 'en-fr' ? currentCard.fr : currentCard.en}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <RotateCcw size={16}/>
                                        <span>Cliquez pour retourner</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </motion.div>
                </div>

                {/* Response Buttons */}
                <AnimatePresence>
                    {isFlipped && !isTransitioning && (
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: 20}}
                            className="flex justify-center gap-6 mt-8"
                        >
                            <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                onClick={() => handleResponse(false)}
                                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                <XCircle size={20}/>
                                <span>À revoir</span>
                            </motion.button>

                            <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                onClick={() => handleResponse(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                <CheckCircle size={20}/>
                                <span>Acquis</span>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress Indicator */}
                <div className="mt-8 flex justify-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                        <Book className="text-purple-600" size={16}/>
                        <span className="text-sm text-gray-600">
                        Direction : {direction === 'en-fr' ? 'Anglais → Français' : 'Français → Anglais'}
                    </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                        <Trophy className="text-yellow-600" size={16}/>
                        <span className="text-sm text-gray-600">
                        Progrès : {Math.round(calculateProgress(currentCard))}%
                    </span>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderCompletionState = () => (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="text-center p-12 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl shadow-lg"
        >
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360, 360]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                }}
                className="inline-block mb-6"
            >
                <Trophy className="text-yellow-500 w-16 h-16"/>
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Félicitations !
            </h3>
            <p className="text-gray-600 mb-6">
                Vous avez maîtrisé tous les mots disponibles. Ajoutez-en de nouveaux pour continuer à progresser !
            </p>
            <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
                <Plus className="mr-2"/>
                Ajouter de nouveaux mots
            </Button>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {renderHeader()}
                {renderAddWordForm()}
                {renderMessage()}
                {renderFlashcard()}

                <div className="mt-8 text-center text-sm text-gray-500">
                    Cliquez sur la carte pour la retourner. Ensuite, indiquez si vous connaissiez la réponse.
                </div>
            </div>
        </div>
    );
};

export default FlashcardGame;