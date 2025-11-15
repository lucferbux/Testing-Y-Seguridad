import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/">
            Comenzar el Curso 🚀
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageContent() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">🧪 Testing Profesional</Heading>
              <p>
                Domina Jest, React Testing Library y Cypress para construir 
                aplicaciones confiables con cobertura completa de tests unitarios, 
                de integración y E2E.
              </p>
            </div>
          </div>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">🔒 Desarrollo Seguro</Heading>
              <p>
                Aprende a identificar y prevenir vulnerabilidades del OWASP Top 10.
                Implementa Helmet.js, validación de datos y gestión segura de secretos.
              </p>
            </div>
          </div>
          <div className={clsx('col col--4')}>
            <div className="text--center padding-horiz--md">
              <Heading as="h3">💼 Enfoque Práctico</Heading>
              <p>
                Ejercicios hands-on, ejemplos del mundo real y mejores prácticas 
                de la industria para aplicar desde el día 1 en tus proyectos.
              </p>
            </div>
          </div>
        </div>
        
        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="text--center">
              <Heading as="h2">📚 Estructura del Curso</Heading>
              <p className="margin-bottom--lg">
                4 sesiones intensivas de 1.5 horas enfocadas en testing y seguridad para Full Stack Developers
              </p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className={clsx('col col--6')}>
            <div className={styles.sessionCard}>
              <Heading as="h4">Sesión 1: Testing Unitario</Heading>
              <p>
                Fundamentos de testing con Jest. Testing de funciones puras y 
                componentes React con React Testing Library.
              </p>
              <Link to="/docs/sesion-01/intro">Ver contenido →</Link>
            </div>
          </div>
          <div className={clsx('col col--6')}>
            <div className={styles.sessionCard}>
              <Heading as="h4">Sesión 2: Testing de Integración</Heading>
              <p>
                Testing de APIs con Supertest, bases de datos con MongoDB Memory Server 
                y mocking de servicios externos con MSW.
              </p>
              <Link to="/docs/sesion-02/intro">Ver contenido →</Link>
            </div>
          </div>
        </div>

        <div className="row margin-top--md">
          <div className={clsx('col col--6')}>
            <div className={styles.sessionCard}>
              <Heading as="h4">Sesión 3: Testing E2E con Cypress</Heading>
              <p>
                Testing End-to-End de flujos completos de usuario. Cypress con 
                time-travel debugging e integración CI/CD.
              </p>
              <Link to="/docs/sesion-03/intro">Ver contenido →</Link>
            </div>
          </div>
          <div className={clsx('col col--6')}>
            <div className={styles.sessionCard}>
              <Heading as="h4">Sesión 4: Seguridad en Aplicaciones Web</Heading>
              <p>
                OWASP Top 10, prevención de XSS/CSRF/Injection, Helmet.js, 
                validación de datos y desarrollo seguro.
              </p>
              <Link to="/docs/sesion-04/intro">Ver contenido →</Link>
            </div>
          </div>
        </div>



        <div className="row margin-top--xl">
          <div className="col col--12">
            <div className="text--center">
              <Heading as="h3">🎯 ¿Listo para empezar?</Heading>
              <p>
                Construye aplicaciones más robustas, seguras y confiables con 
                las mejores prácticas de la industria.
              </p>
              <div className={styles.buttons}>
                <Link
                  className="button button--primary button--lg"
                  to="/docs/">
                  Comenzar ahora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Aprende testing y seguridad para aplicaciones Full Stack. Jest, Cypress, OWASP Top 10 y mejores prácticas.">
      <HomepageHeader />
      <main>
        <HomepageContent />
      </main>
    </Layout>
  );
}

