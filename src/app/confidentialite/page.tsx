import PublicLayout from '@/components/public/PublicLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité de QRTags - Comment nous protégeons vos données personnelles.',
};

export default function Confidentialite() {
  return (
    <PublicLayout>
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Politique de confidentialité</h1>
          
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
              <p className="mb-4">
                La société MMASOLUTION s&apos;engage à protéger la vie privée des utilisateurs de son site QRTags. La présente politique de confidentialité a pour but de vous informer sur la manière dont nous collectons, utilisons et protégeons vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD).
              </p>
              <p>
                En utilisant notre site et nos services, vous acceptez les pratiques décrites dans cette politique de confidentialité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Données collectées</h2>
              <p className="mb-4">Nous collectons les types de données suivantes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Données d&apos;identification :</strong> nom, prénom, adresse email, numéro de téléphone</li>
                <li><strong>Données de voyage :</strong> informations relatives aux objets enregistrés, dates de voyage, destinations</li>
                <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, pages visitées, durée des sessions</li>
                <li><strong>Données de localisation :</strong> localisation approximative lors du scan des QR codes</li>
                <li><strong>Données de communication :</strong> messages envoyés via le formulaire de contact ou le chat intégré</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Finalités du traitement</h2>
              <p className="mb-4">Vos données personnelles sont collectées et traitées pour les finalités suivantes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gestion et suivi des objets enregistrés via le système QRTags</li>
                <li>Faciliter la restitution des objets perdus ou trouvés</li>
                <li>Communication avec les utilisateurs (notifications, alertes)</li>
                <li>Amélioration de nos services et de l&apos;expérience utilisateur</li>
                <li>Respect de nos obligations légales</li>
                <li>Envoi d&apos;informations commerciales (avec votre consentement)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Base légale du traitement</h2>
              <p className="mb-4">Le traitement de vos données personnelles repose sur les bases légales suivantes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Exécution du contrat :</strong> pour la fourniture de nos services de protection des objets</li>
                <li><strong>Consentement :</strong> pour l&apos;envoi de communications commerciales et l&apos;utilisation de cookies non essentiels</li>
                <li><strong>Intérêt légitime :</strong> pour l&apos;amélioration de nos services et la sécurité du site</li>
                <li><strong>Obligation légale :</strong> pour le respect de nos obligations réglementaires</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Cookies</h2>
              <p className="mb-4">
                Notre site utilise des cookies pour améliorer votre expérience de navigation. Un cookie est un petit fichier texte stocké sur votre appareil.
              </p>
              <p className="mb-4"><strong>Types de cookies utilisés :</strong></p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (session, sécurité)</li>
                <li><strong>Cookies analytiques :</strong> pour mesurer l&apos;audience et améliorer le site (avec votre consentement)</li>
                <li><strong>Cookies de préférence :</strong> pour mémoriser vos choix (langue, consentement RGPD)</li>
              </ul>
              <p>
                Vous pouvez à tout moment modifier vos préférences en cliquant sur le bandeau cookies en bas de page ou en paramétrant votre navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Durée de conservation</h2>
              <p className="mb-4">
                Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Données de compte : durée de l&apos;inscription + 3 ans</li>
                <li>Données de objets : durée de validité du QR code + 1 an</li>
                <li>Données de connexion : 13 mois maximum</li>
                <li>Cookies : 13 mois maximum</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Vos droits</h2>
              <p className="mb-4">
                Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
                <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@qrtags.com" className="text-[#b8860b] hover:underline">contact@qrtags.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Partage des données</h2>
              <p className="mb-4">
                Vos données personnelles peuvent être partagées avec :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nos partenaires de livraison pour l&apos;expédition des autocollants QRTags</li>
                <li>Les autorités compétentes si la loi l&apos;exige</li>
                <li>Nos prestataires techniques (hébergement, paiement) sous strictes conditions de confidentialité</li>
              </ul>
              <p className="mt-4">
                Nous ne vendons jamais vos données personnelles à des tiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction. Ces mesures incluent le chiffrement des données, des pare-feu, et des accès restreints aux données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Contact</h2>
              <p className="mb-4">
                Pour toute question relative à cette politique de confidentialité ou pour exercer vos droits, vous pouvez nous contacter :
              </p>
              <p>
                <strong>Email :</strong> <a href="mailto:contact@qrtags.com" className="text-[#b8860b] hover:underline">contact@qrtags.com</a><br />
                <strong>Adresse :</strong> Poissy, France
              </p>
              <p className="mt-4">
                Vous avez également le droit d&apos;introduire une réclamation auprès de la CNIL (Commission Nationale de l&apos;Informatique et des Libertés) si vous estimez que le traitement de vos données n&apos;est pas conforme à la réglementation.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1a2238]">
            <p className="text-[#a0a8b8] text-sm">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
