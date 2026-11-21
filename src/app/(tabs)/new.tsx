import { Redirect } from 'expo-router';

/**
 * Placeholder route for the centre tab button. The button itself opens the customer picker,
 * so this screen is never shown; if reached by a link, show the customer list.
 */
export default function NewTabPlaceholder() {
  return <Redirect href="/customers" />;
}
