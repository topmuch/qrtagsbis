import PublicLayout from '@/components/public/PublicLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site QRTags - Protection intelligente des objets.',
};

export default function MentionsLegales() {
  return (
    <PublicLayout>
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">Mentions légales</h1>
          
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Éditeur du site</h2>
              <p className="mb-4">
                Le site QRTags est édité par la société MMASOLUTION, société [forme juridique] au capital de [montant] euros, immatriculée au Registre du Commerce et des Sociétés de [ville] sous le numéro [numéro SIRET].
              </p>
              <p>
                <strong>Siège social :</strong> Poissy, France<br />
                <strong>Téléphone :</strong> [numéro de téléphone]<br />
                <strong>Email :</strong> contact@qrtags.com<br />
                <strong>Directeur de la publication :</strong> [Nom du directeur]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Hébergement</h2>
              <p>
                Le site est hébergé par [Nom de l'hébergeur], [adresse de l'hébergeur], [téléphone de l'hébergeur].
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Propriété intellectuelle</h2>
              <p className="mb-4">
                L&apos;ensemble du contenu du site QRTags (textes, images, vidéos, logos, icônes, sons, logiciels, etc.) est la propriété exclusive de MMASOLUTION ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de MMASOLUTION.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Données personnelles</h2>
              <p className="mb-4">
                Les informations concernant la collecte et le traitement des données personnelles sont détaillées dans notre <a href="/confidentialite" className="text-[#b8860b] hover:underline">Politique de confidentialité</a>.
              </p>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données personnelles. Pour exercer ces droits, vous pouvez nous contacter à : contact@qrtags.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Cookies</h2>
              <p className="mb-4">
                Le site QRTags utilise des cookies pour améliorer l&apos;expérience utilisateur. Ces cookies sont soumis à votre consentement préalable, conformément à la réglementation applicable.
              </p>
              <p>
                Pour en savoir plus sur l&apos;utilisation des cookies, veuillez consulter notre <a href="/confidentialite" className="text-[#b8860b] hover:underline">Politique de confidentialité</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Limitation de responsabilité</h2>
              <p className="mb-4">
                MMASOLUTION s&apos;efforce d&apos;assurer au mieux l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, MMASOLUTION ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition sur ce site.
              </p>
              <p>
                En conséquence, MMASOLUTION décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Droit applicable</h2>
              <p>
                Les présentes mentions légales sont soumises au droit français. En cas de litige et à défaut d&apos;accord amiable, le litige sera porté devant les tribunaux français conformément aux règles de compétence en vigueur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Contact</h2>
              <p>
                Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à : <a href="mailto:contact@qrtags.com" className="text-[#b8860b] hover:underline">contact@qrtags.com</a>
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
