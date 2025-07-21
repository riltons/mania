import { useLocalSearchParams } from "expo-router";
import CompetitionDetailsScreen from "@/features/competitions/screens/CompetitionDetailsScreen";

export default function CompetitionDetailsPage() {
  const { id } = useLocalSearchParams();
  return <CompetitionDetailsScreen id={id as string} />;
}