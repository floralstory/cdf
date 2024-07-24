import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    height:"100vh"
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    textDecoration: "underline"
  },
  subHeader: {
    fontSize: 10,
    marginBottom: 5,
  },
  subHeaderText:{
    fontSize: 10,
    fontWeight: 800
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  addressText: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.5
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 10,
    alignSelf: 'left',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 10,
    marginBottom: 30,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomStyle: 'solid',
    borderBottomWidth: 0.5,
    borderColor: 'black',
    justifyContent:"space-between",
    alignContent: "center"
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    alignItems:"center"
  },
  totalAmount: {
    marginTop: 5,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    width: "45%",
    paddingTop: 3,
    marginLeft: 'auto',
  },
  totalAmountCell: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#000000',
    width: '100%',
    justifyContent: 'space-between',
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderColor: '#bfbfbf',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8,
  },
  footnote: {
    marginTop: 10,
    fontSize: 8,
    textAlign: 'center',
  },
});

// Define the Invoice component
const Invoice = ({ sale }) => (
  <Document>
    <Page size="A4" style={styles.page}>
        <Image src="/images/cdf-logo.png" style={styles.logo} />
        <Text style={styles.header}>Tax Invoice</Text>
        <View style={styles.addressContainer}>
          <View>
            <Text style={styles.addressText}>CHATEAU DES FLEURS DMCC</Text>
            <Text style={styles.addressText}>LAKE VIEW TOWER JUMEIRAH</Text>
            <Text style={styles.addressText}>UNIT: CL12 DUBAI</Text>
          </View>
          <View>
            <Text style={styles.addressText}>TRN: 04541999900003</Text>
            <Text style={styles.addressText}>Invoice No: {sale.InvoiceCode}</Text>
            <Text style={styles.addressText}>PreparedBy: {sale.preparedBy}</Text>
            <Text style={styles.addressText}>Date: {sale.date}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.subHeader}>Bill To:</Text>
          <Text style={styles.subHeaderText}>{sale.name || 'Not provided'}</Text>
          <Text style={styles.subHeaderText}>{sale.phone || 'Not provided'}</Text>
          <Text style={styles.subHeaderText}>{sale.email || 'Not provided'}</Text>
          <Text style={styles.subHeaderText}>{sale.paidBy || 'Not provided'}</Text>
        </View>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Item</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Quantity</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Rate</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Total</Text>
          </View>
          {sale.saleItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.productName}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              <Text style={styles.tableCell}>AED {item.price}</Text>
              <Text style={styles.tableCell}>AED {item.quantity * item.price}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totalAmount}>
            <View style={styles.totalAmountCell}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Items Total:</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>AED {sale.itemsTotal}</Text>
            </View>
            <View style={styles.totalAmountCell}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Discount:</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>AED {sale.discount}</Text>
            </View>
            <View style={styles.totalAmountCell}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Taxable Amount:</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>AED {sale.subTotal}</Text>
            </View>
            <View style={styles.totalAmountCell}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Vat(5%)</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>AED {sale.vat}</Text>
            </View>
            <View style={styles.totalAmountCell}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Total Inc.Vat:</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>AED {sale.total}</Text>
            </View>
          </View>
        <View style={styles.footer}>
          <View style={styles.footnote}>
          <Text>Website: chateaudesfleursuae.com | Phone: +971542045428 | Email: info@chateaudesfleursuae.com</Text>
          </View>
          <View style={styles.footnote}>
          <Text>This is a system Generated Invoice, it Requires No extra action</Text>
        </View>
        </View>
    </Page>
  </Document>
);

export default Invoice;
