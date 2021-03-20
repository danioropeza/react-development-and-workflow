import React, { useState, useEffect } from 'react';
import {
  Button, Stepper, Step, StepLabel, MobileStepper, useMediaQuery, Hidden,
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { ValidatorForm } from 'react-material-ui-form-validator';
import axios from '../../api';
import { getUser } from '../../helpers/auth-helper';
import Spinner from '../shared/spinner';
import ErrorMessage from '../shared/errorMessage';
import SubheaderContainer from '../subheaderContainer';
import PersonalData from './personalData';
import GeolocationAddress from './geolocationAddress';
import Files from './files';
import ReferencesForm from './references';
import ServicesTable from './servicesTable';
import GeolocationWorkArea from './geolocationWorkArea';
import Note from './note';
import Preview from './preview';
import FinalMessage from './finalMessage';
import useStyle from './SubscriptionFormCss';
import {
  geolocationState, filesState, referencesState,
  personalDataState, activeServicesState, noteState,
} from './states';

const SubscriptionForm = () => {
  const steps = ['Datos personales', 'Geolocalización', 'Archivos', 'Referencias', 'Servicios', 'Área de trabajo', 'Nota', 'Preview'];
  const certificatesLimit = 10;

  const classes = useStyle();
  const theme = useTheme();
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('sm'));

  const userAuthData = getUser();
  const [personalData, setPersonalData] = useState({
    ...personalDataState,
    userAuthId: userAuthData.sub,
    name: userAuthData.name,
    email: userAuthData.email,
    whatsAppNumber: userAuthData.phone_number,
  });
  const [geolocation, setGeolocation] = useState(geolocationState);
  const [files, setFiles] = useState(filesState);
  const [references, setReferences] = useState(referencesState);
  const [activeServices, setActiveServices] = useState(activeServicesState);
  const [note, setNote] = useState(noteState);

  const [activeStep, setActiveStep] = useState(0);

  const [cities, setCities] = useState({
    data: [],
    isLoading: true,
    error: '',
  });
  const [idCardExtensions, setIdCardExtensions] = useState({
    data: [],
    isLoading: true,
    error: '',
  });
  const [jobServices, setJobServices] = useState({
    data: [],
    isLoading: true,
    error: '',
  });
  const [doSubscription, setDoSubscription] = useState({
    isLoading: false,
    error: '',
  });
  useEffect(() => {
    axios.getInstance().get('/cities')
      .then(({ data }) => setCities((citiesState) => ({ ...citiesState, data, isLoading: false })))
      .catch((error) => setCities({ error, isLoading: false }));
    axios.getInstance().get('/jobServices')
      .then(({ data }) => setJobServices((jobServicesState) => ({ ...jobServicesState, data, isLoading: false })))
      .catch((error) => setJobServices({ error, isLoading: false }));
    axios.getInstance().get('/idCardExtensions')
      .then(({ data }) => setIdCardExtensions((extensionsState) => ({ ...extensionsState, data, isLoading: false })))
      .catch((error) => setIdCardExtensions({ error, isLoading: false }));
  }, []);

  function handleNext() {
    setActiveStep(activeStep + 1);
  }

  function handleBack() {
    setActiveStep(activeStep - 1);
  }

  function prepareFormData(subscriptionRequestDTO) {
    const formData = new FormData();
    formData.append('dataInformation', JSON.stringify(subscriptionRequestDTO));
    formData.append('note', note);
    formData.append('addressSupportDocument', files.addressSupportDocument);
    formData.append('criminalRecord', files.criminalRecord);
    Array.from(files.idCardDocument).map((file) => formData.append('idCardDocument', file));
    Array.from(files.certificates).map((certificate) => formData.append('certificates', certificate));
    return formData;
  }

  function prepareRequestDTO() {
    return (
      {
        ...personalData,
        ...geolocation,
        ...references,
        jobServices: activeServices,
        certificates: {
          uris: [],
          descriptions: files.certificatesDescriptions,
        },
      }
    );
  }

  function handleSubmit() {
    const subscriptionRequestDTO = prepareRequestDTO();
    const formData = prepareFormData(subscriptionRequestDTO);
    setDoSubscription({ ...doSubscription, isLoading: true });
    axios.getInstance().post('/subscriptionRequests', formData)
      .then(() => {
        handleNext();
        setDoSubscription({ ...doSubscription, isLoading: false });
      })
      .catch((error) => setDoSubscription({ error, isLoading: false }));
  }

  function handleNoteChange(noteValue) {
    setNote(noteValue);
  }

  function isServiceNotFound(servicePosition) {
    return servicePosition === -1;
  }


  function handleServicesChange(service) {
    const servicePosition = activeServices.indexOf(service);
    if (isServiceNotFound(servicePosition)) {
      setActiveServices([...activeServices, service]);
    } else {
      activeServices.splice(servicePosition, 1);
      setActiveServices([...activeServices]);
    }
  }

  function handleReferenceChange(referenceKind, position, fieldName, value) {
    const referenceValue = references[referenceKind];
    referenceValue[position][fieldName] = value;
    setReferences({ ...references, [referenceKind]: referenceValue });
  }

  function handleCertificatesDescriptionsChange(index, value) {
    const { certificatesDescriptions } = files;
    certificatesDescriptions[index] = value;
    setFiles({ ...files, certificatesDescriptions });
  }

  function areIdCardDocumentFilesLessThanTheLimit(size) {
    return size <= 2;
  }

  function areCertificatesLessThanTheLimit(size) {
    return size <= certificatesLimit;
  }

  function isFileTypePermitted(type) {
    return type === 'application/pdf'
    || type === 'image/jpg'
    || type === 'image/jpeg'
    || type === 'image/png';
  }

  function areFilesTypePermitted(filesList) {
    for (let index = 0; index < filesList.length; index++) {
      if (!isFileTypePermitted(filesList[index].type)) {
        return false;
      }
    }
    return true;
  }

  function isEmptyCharge(charge) {
    return undefined === charge || charge.length === 0;
  }

  function handleCertificatesCharge(certificates) {
    if (!isEmptyCharge(certificates) && areFilesTypePermitted(certificates)
    && areCertificatesLessThanTheLimit(certificates.length)) {
      setFiles({
        ...files,
        certificates,
        certificatesDescriptions: Array.apply(null, { length: certificates.length }).map(() => ''),
      });
    }
  }

  function handleFileCharge(file, fieldName) {
    if (!isEmptyCharge(file) && isFileTypePermitted(file.type)) {
      setFiles({ ...files, [fieldName]: file });
    }
  }

  function handleFileChargeForIdCardDocument(idCardDocumentFiles) {
    if (!isEmptyCharge(idCardDocumentFiles) && areFilesTypePermitted(idCardDocumentFiles)
    && areIdCardDocumentFilesLessThanTheLimit(idCardDocumentFiles.length)) {
      setFiles({ ...files, idCardDocument: idCardDocumentFiles });
    }
  }

  function onWheelChangeInsideMap(event, isScrollingUp, fromButton) {
    if (event.cancelable && fromButton) {
      event.preventDefault();
    }
    const { geolocationWorkArea } = geolocation;
    let newRadius = geolocationWorkArea.radius;
    if (isScrollingUp) {
      newRadius += 100;
    } else {
      newRadius -= 100;
    }
    geolocationWorkArea.radius = newRadius;
    setGeolocation({ ...geolocation, geolocationWorkArea });
  }

  function handleClickMap(longitude, latitude, fieldName) {
    const geolocationField = geolocation[fieldName];
    geolocationField.coordinates = [longitude, latitude];
    setGeolocation({ ...geolocation, [fieldName]: geolocationField });
  }

  function handleExtensionChange(extension) {
    setPersonalData({ ...personalData, idCardExtension: extension });
  }

  function handleCityChange(selectedCity) {
    const [longitude, latitude] = selectedCity.geolocation.coordinates;
    const { geolocationAddress, geolocationWorkArea } = geolocation;
    geolocationAddress.coordinates = [longitude, latitude];
    geolocationWorkArea.coordinates = [longitude, latitude];
    setPersonalData({ ...personalData, city: selectedCity });
    setGeolocation({ geolocationAddress, geolocationWorkArea });
  }

  function handlePersonalDataChange(fieldName, value) {
    setPersonalData({ ...personalData, [fieldName]: value });
  }

  const getStepContent = (step) => {
    switch (step) {
    case 0:
      return (
        <PersonalData
          personalData={personalData}
          cities={cities.data}
          extensions={idCardExtensions.data}
          handlePersonalDataChange={handlePersonalDataChange}
          handleCityChange={handleCityChange}
          handleExtensionChange={handleExtensionChange}
        />
      );
    case 1:
      return (
        <GeolocationAddress
          coordinates={geolocation.geolocationAddress.coordinates}
          handleClickMap={handleClickMap}
        />
      );
    case 2:
      return (
        <Files
          files={files}
          handleFileCharge={handleFileCharge}
          handleFileChargeForIdCardDocument={handleFileChargeForIdCardDocument}
          handleCertificatesCharge={handleCertificatesCharge}
          handleCertificatesDescriptionsChange={handleCertificatesDescriptionsChange}
        />
      );
    case 3:
      return (
        <ReferencesForm
          references={references}
          handleReferenceChange={handleReferenceChange}
        />
      );
    case 4:
      return (
        <ServicesTable
          jobServices={jobServices.data}
          handleServicesChange={handleServicesChange}
          activeServices={activeServices}
        />
      );
    case 5:
      return (
        <GeolocationWorkArea
          coordinates={geolocation.geolocationWorkArea.coordinates}
          handleClickMap={handleClickMap}
          radius={geolocation.geolocationWorkArea.radius}
          onWheelChangeInsideMap={onWheelChangeInsideMap}
        />
      );
    case 6:
      return <Note note={note} handleNoteChange={handleNoteChange} />;
    case 7:
      return (
        <Preview
          personalData={personalData}
          geolocation={geolocation}
          files={files}
          references={references}
          activeServices={activeServices}
          note={note}
        />
      );
    default:
      throw new Error('Unknown step');
    }
  };

  function isLastStep() {
    return activeStep === steps.length - 1;
  }

  const NextButton = () => (
    <Button
      type="submit"
      variant={isSmallDevice ? 'text' : 'contained'}
      color="primary"
      size={isSmallDevice ? 'small' : 'medium'}
      className={isSmallDevice ? '' : classes.button}
    >
      {isLastStep() ? 'Registrarme' : 'Siguiente'}
      {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
    </Button>
  );

  const BackButton = () => (
    <Button
      onClick={handleBack}
      size={isSmallDevice ? 'small' : 'medium'}
      className={isSmallDevice ? '' : classes.button}
      disabled={activeStep === 0}
    >
      {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      Atras
    </Button>
  );

  const NavigationButtons = () => (
    <div className={classes.buttons}>
      <BackButton />
      <NextButton />
    </div>
  );

  function validateForm() {
    if (isLastStep()) {
      handleSubmit();
    } else {
      handleNext();
    }
  }


  function isLoading() {
    return cities.isLoading || idCardExtensions.isLoading || jobServices.isloading || doSubscription.isLoading;
  }

  function hasError() {
    return cities.error || idCardExtensions.error || jobServices.error || doSubscription.error;
  }

  if (isLoading()) {
    return (
      <SubheaderContainer>
        <Spinner />
      </SubheaderContainer>
    );
  }

  if (hasError()) {
    return (
      <>
        <SubheaderContainer title="Formulario de registro">
          {cities.error && <ErrorMessage error={cities.error} />}
          {idCardExtensions.error && <ErrorMessage error={idCardExtensions.error} />}
          {jobServices.error && <ErrorMessage error={jobServices.error} />}
          {doSubscription.error && <ErrorMessage error={doSubscription.error} />}
        </SubheaderContainer>
      </>
    );
  }

  return (
    <SubheaderContainer title="Formulario de registro">
      {activeStep === steps.length ? <FinalMessage /> : (
        <ValidatorForm onSubmit={validateForm}>
          {getStepContent(activeStep)}
          <br />
          <Hidden xsDown>
            <NavigationButtons />
            <Stepper activeStep={activeStep} alternativeLabel className={classes.stepper}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Hidden>
          <Hidden smUp>
            <MobileStepper
              steps={steps.length}
              position="static"
              variant="dots"
              activeStep={activeStep}
              nextButton={<NextButton />}
              backButton={<BackButton />}
            />
          </Hidden>
        </ValidatorForm>
      )}
    </SubheaderContainer>
  );
};

export default SubscriptionForm;
