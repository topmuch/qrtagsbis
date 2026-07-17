import PublicLayout from '@/components/public/PublicLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation',
  description: 'CGU de QRTags - Conditions d\'utilisation de nos services de protection des objets.',
};

export default function CGU() {
  return (
    <PublicLayout>
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Conditions Générales d&apos;Utilisation</h1>
          
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Objet</h2>
              <p className="mb-4">
                Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de définir les modalités et conditions d&apos;utilisation des services proposés par QRTags, ainsi que de définir les droits et obligations des parties dans ce cadre.
              </p>
              <p>
                En utilisant les services QRTags, vous acceptez sans réserve les présentes CGU. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Description des services</h2>
              <p className="mb-4">
                QRTags propose un service de protection des objets basé sur la technologie QR Code. Les services incluent :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fourniture d&apos;autocollants QR Code à apposer sur les objets</li>
                <li>Plateforme de signalement et de suivi des objets perdus ou trouvés</li>
                <li>Notifications en temps réel lors du scan d&apos;un objet</li>
                <li>Interface de gestion pour les agences de voyage et organisateurs de pèlerinage</li>
                <li>Service client pour faciliter la restitution des objets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Inscription et compte utilisateur</h2>
              <p className="mb-4">
                L&apos;utilisation de certains services nécessite la création d&apos;un compte utilisateur. Lors de votre inscription, vous vous engagez à :
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Fournir des informations exactes et complètes</li>
                <li>Maintenir la confidentialité de vos identifiants de connexion</li>
                <li>Nous informer de toute utilisation non autorisée de votre compte</li>
                <li>Ne pas créer plusieurs comptes pour une même personne</li>
              </ul>
              <p>
                QRTags se réserve le droit de suspendre ou supprimer un compte en cas de non-respect des présentes CGU.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Utilisation des services</h2>
              <p className="mb-4">En utilisant nos services, vous vous engagez à :</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Utiliser les services uniquement à des fins licites</li>
                <li>Ne pas tenter de contourner les mesures de sécurité</li>
                <li>Ne pas utiliser les services pour nuire à autrui</li>
                <li>Respecter les droits de propriété intellectuelle de QRTags</li>
                <li>Signaler tout contenu ou comportement inapproprié</li>
              </ul>
              <p>
                L&apos;utilisation des services QRTags à des fins frauduleuses ou malveillantes est strictement interdite et pourra faire l&apos;objet de poursuites judiciaires.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Activation et validité des QR codes</h2>
              <p className="mb-4">
                Chaque autocollant QRTags comporte un QR Code unique qui doit être activé pour être fonctionnel. Les conditions d&apos;activation sont les suivantes :
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>L&apos;activation se fait via le site web QRTags en scannant le QR Code ou en saisissant la référence</li>
                <li>Un QR Code actif est valide pour une durée déterminée selon le forfait choisi</li>
                <li>La validité peut être prolongée en souscrivant à une extension</li>
                <li>Un QR Code non activé n&apos;est pas fonctionnel</li>
              </ul>
              <p>
                Il est de votre responsabilité d&apos;activer votre QR Code avant votre voyage pour bénéficier de la protection.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Signalement et restitution</h2>
              <p className="mb-4">
                En cas de perte ou de trouvaille d&apos;un objet équipé d&apos;un QR Code QRTags :
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Le scan du QR Code déclenche une notification au propriétaire du objet</li>
                <li>Une messagerie sécurisée permet la communication entre les parties</li>
                <li>QRTags facilite la mise en relation mais n&apos;assure pas le transport du objet</li>
                <li>Les informations personnelles restent protégées jusqu&apos;à consentement explicite</li>
              </ul>
              <p>
                QRTags ne peut être tenu responsable en cas d&apos;impossibilité de restitution du objet.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Tarifs et paiement</h2>
              <p className="mb-4">
                Les tarifs des services QRTags sont affichés sur le site et peuvent être modifiés à tout moment. Les conditions de paiement sont les suivantes :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Le paiement s&apos;effectue en ligne par carte bancaire ou autre moyen proposé</li>
                <li>La souscription est ferme et définitive après confirmation du paiement</li>
                <li>Les prix sont indiqués en euros TTC</li>
                <li>Aucun remboursement n&apos;est effectué en cas de non-utilisation du service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Responsabilité</h2>
              <p className="mb-4">
                QRTags s&apos;engage à mettre en œuvre tous les moyens nécessaires pour assurer le bon fonctionnement de ses services. Toutefois, QRTags ne pourra être tenu responsable :
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Des dommages résultant d&apos;une utilisation non conforme aux services</li>
                <li>De l&apos;impossibilité d&apos;accès au service en cas de force majeure</li>
                <li>Des pertes ou vols de objets non signalés via la plateforme</li>
                <li>Des retards ou défauts de livraison des autocollants imputables aux transporteurs</li>
              </ul>
              <p>
                La responsabilité de QRTags est limitée au montant des sommes versées par l&apos;utilisateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Propriété intellectuelle</h2>
              <p className="mb-4">
                L&apos;ensemble des éléments constituant le site QRTags (textes, images, logos, icônes, logiciels, QR Codes, etc.) est protégé par le droit de la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation ou utilisation non autorisée de ces éléments est strictement interdite et pourra faire l&apos;objet de poursuites judiciaires.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Protection des données</h2>
              <p className="mb-4">
                Les données personnelles collectées par QRTags sont traitées conformément à notre <a href="/confidentialite" className="text-[#b8860b] hover:underline">Politique de confidentialité</a> et dans le respect du Règlement Général sur la Protection des Données (RGPD).
              </p>
              <p>
                Pour toute question relative à vos données personnelles, contactez-nous à : contact@qrtags.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Modification des CGU</h2>
              <p>
                QRTags se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par notification sur le site ou par email. L&apos;utilisation continue des services après modification vaut acceptation des nouvelles CGU.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Résiliation</h2>
              <p className="mb-4">
                Vous pouvez à tout moment demander la suppression de votre compte en contactant notre service client. En cas de résiliation :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vos données seront supprimées dans un délai de 30 jours</li>
                <li>Vos QR Codes actifs seront désactivés</li>
                <li>Aucun remboursement ne sera effectué pour la période restante</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Droit applicable et juridiction</h2>
              <p>
                Les présentes CGU sont soumises au droit français. En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes CGU, et à défaut d&apos;accord amiable, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">14. Contact</h2>
              <p className="mb-4">
                Pour toute question relative aux présentes CGU, vous pouvez nous contacter :
              </p>
              <p>
                <strong>Email :</strong> <a href="mailto:contact@qrtags.com" className="text-[#b8860b] hover:underline">contact@qrtags.com</a><br />
                <strong>Adresse :</strong> Poissy, France
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
